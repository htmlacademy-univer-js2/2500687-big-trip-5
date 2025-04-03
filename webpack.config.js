const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.js', // Точка входа — файл main.js
  output: {
    path: path.resolve(__dirname, 'build'), // Абсолютный путь к папке build
    filename: 'bundle.[contenthash].js', // Имя выходного файла
    clean: true, // Очистка папки build перед сборкой
  },
  devtool: 'source-map', // Генерация source-maps для отладки
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/, // Обрабатываем все .js файлы
        exclude: /(node_modules)/, // Исключаем node_modules
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'], // Используем preset-env
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
    ],
  },
};
