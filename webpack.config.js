const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // 警告をエラーとして扱わない
  stats: {
    warningsFilter: [/failed to load source map/], // ソースマップの読み込み失敗の警告を除外
    errorDetails: true, // エラーの詳細を表示
  },
  // エラー発生時の処理をカスタマイズ
  infrastructureLogging: {
    level: 'warn', // ログレベルをwarnに設定（errorよりも低いレベル）
  },
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.ts',
    popup: './src/popup/index.ts',
    options: './src/options/index.ts',
    styles: './src/styles/tailwind.css',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // エラーを警告として扱い、ビルドを中断しない
            compilerOptions: {
              noEmitOnError: false // エラーがあっても出力を生成する
            }
          }
        },
        exclude: /node_modules/,
      },      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '' },
        { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
      ],
    }),    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup', 'styles'],
    }),new HtmlWebpackPlugin({
      template: './src/options/options.html',
      filename: 'options.html',
      chunks: ['options', 'styles'],
    }),
  ],
  devtool: 'cheap-module-source-map',
};
