const router = require('express').Router();
const { Product, product, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  try {
    const productData = await Product.findAll({
      include: ({model: Product, model: Tag})
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err)
  }
  // be sure to include its associated product and Tag data
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  try{
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Product, model: Tag }],
    });

    if (!productData){
      res.status(404).json({message: 'No product found with that ID'});
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err)
  }
  // be sure to include its associated product and Tag data
});

// create new product
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create({
      product_name: req.body.product_name,
      price: req.body.price,
      stock: req.body.stock,
      category_id: req.body.category_id,
      tagIds: req.body.tags
    });
    console.log(req.body.tags)
    // Check if there are tags in the request body
    if (req.body.tags && req.body.tags.length) {
      const productTagIdArr = req.body.tags.map((tag_id) => {
        return {
          product_id: newProduct.id,
          tag_id,
        };
      });

      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(200).json(newProduct);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  const productData = Product.update(req.body, {
    where: {id: req.params.id},
  })
    .then((product) => {
      if (req.body.tags && req.body.tags.length) {
        
        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tags
          .filter((tag_id) => !productTagIds.includes(tag_id))
          .map((tag_id) => {
            return {
              product_id: req.params.id,
              tag_id,
            };
          });

            // figure out which ones to remove
          const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tags.includes(tag_id))
          .map(({ id }) => id);
                  // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {id: req.params.id},
    });
    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
