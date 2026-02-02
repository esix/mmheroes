import HtmlWebpackPlugin from 'html-webpack-plugin';

const webConfig =  {
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: './index.html',
    }),
  ],
  resolve: {
    fallback: {
      // Игнорируем Node.js модули в браузерной сборке
      'readline': false,
      'util': false,
      'path': false,
      'fs': false,
      'os': false,
      'stream': false,
      'events': false,
      'process': false,
    }
  },
};

export default webConfig;
