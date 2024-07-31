const path = require("path");

const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const adminController = require("../controllers/admin");

const isAuth = require("../middleware/is-auth");

//path module is required for path because node don't know the path
// ../ tells you to go one level up
// views folder
router.get("/add-product", isAuth, adminController.getAddProduct);

router.post(
  "/add-product",
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Enter Title with min 3 characters"),
    body("price").isFloat().withMessage("Enter price with decimals"),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage("Enter description with min 3 and max 400 characters"),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "Enter Title with min 3 characters")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "Enter price with decimals").isFloat(),
    body("description", "Enter description with min 3 and max 400 characters")
      .isLength({ min: 5, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.get("/products", isAuth, adminController.getProducts);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
