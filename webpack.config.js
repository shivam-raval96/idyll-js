const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const fs = require("fs");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

module.exports = {
  entry: {
    distill: "./src/distill.js",
    main: "./src/index.js",
  },
  output: {
    filename: "[name].bundle.js", // The output file
    path: path.resolve(__dirname, "dist"), // Output directory
  },
  module: {
    rules: [
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      {
        test: /\.(js|mjs)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {},
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: "assets",
          to: "assets",
        },

        { from: "src/style.css", to: "style.css" },
        { from: "src/bibliography.bib", to: "bibliography.bib" },
        {
          from: "src/index.html",
          to: "index.html",
        },
      ],
    }),
  ],
  devtool:
    process.env.NODE_ENV === "production" ? "source-map" : "eval-source-map",
  devServer: {
    static: "./dist", // Serve files from the 'dist' directory
    open: process.env.NODE_ENV !== "production", // Automatically open the browser unless in production
    hot: process.env.NODE_ENV !== "production", // Enable hot module replacement unless in production
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  optimization: {
    minimizer: [
      // Image optimization disabled due to Git LFS pointer files
      // Uncomment and configure Git LFS if you need image optimization
      // new ImageMinimizerPlugin({
      //     minimizer: [{
      //         implementation: ImageMinimizerPlugin.sharpMinify,
      //         options: {
      //             encodeOptions: {
      //                 // For JPG
      //                 jpeg: {
      //                     quality: 80
      //                 },
      //                 // For PNG
      //                 png: {
      //                     quality: 80
      //                 },
      //                 // For WebP
      //                 webp: {
      //                     quality: 80
      //                 }
      //             }
      //         }
      //     },
      //     {
      //         implementation: ImageMinimizerPlugin.svgoMinify,
      //         options: {
      //             encodeOptions: {
      //                 multipass: true,
      //                 plugins: [
      //                     'preset-default',
      //                 ]
      //             }
      //         }
      //     }
      // ]
      // }),
      //Hynek: Ideally we don't run this twice but we
    ],
  },
};

console.log(process.env.NODE_ENV);
