//Встроенный модуль, предоставляет набор функций для работы с путями в файловой системе
const path = require("path");
//реализует ввод/вывод файлов
const fs = require("fs");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');

function generateHtmlPlugins(templateDir) {
  //path.resolve принимает составные части пути и возвращает абсолютный путь полученного в результате обработки переданных сегментов пути.
  //fs.readdirSync чтение содержимого папки — то есть — сведений о том, какие файлы и поддиректории в ней имеются, и возврат их относительных путей
  //т.е. templateFiles содержит пути к файлам и директориям
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
  return templateFiles.map((item) => {
    const parts = item.split(".");
    //тут у нас имя файла
    const name = parts[0];
    //расширение
    const extension = parts[1];
    //
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: false,
    });
  });
}

const htmlPlugins = generateHtmlPlugins("./src/html/views");

const config = {
  entry: ["./src/js/index.js", "./src/scss/style.scss"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "./js/bundle.js",
  },
  devtool: "source-map",
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
      new TerserPlugin({
        extractComments: true,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(sass|scss)$/,
        include: path.resolve(__dirname, "src/scss"),
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              url: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.pug$/,
        loader: "pug-loader",
        options: {
          pretty: true
        }
      },
      {
        //не поняла почему не использует путь из общих настроек path: path.resolve(__dirname, "dist") для publicPath   ,
        test: /\.svg$/,
        include: path.resolve(__dirname, "src/svg"),
        loader: 'svg-sprite-loader',
        options: {
          extract: true,
          publicPath: path.resolve(__dirname, 'dist/img'),
          spriteFilename: 'sprite.svg'
        }

      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "./css/style.bundle.css",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./src/fonts",
          to: "./fonts",
        },
        {
          from: "./src/favicon",
          to: "./favicon",
        },
         {
           from: "./src/img",
           to: "./img",
         },
      ],
    }),
    new SpriteLoaderPlugin({plainSprite: true}),
  ].concat(htmlPlugins),
};

module.exports = (env, argv) => {
  if (argv.mode === "production") {
    config.plugins.push(new CleanWebpackPlugin());
  }
  return config;
};
