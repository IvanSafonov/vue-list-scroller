const devPresets = ['@vue/babel-preset-app']
const buildPresets = ['@babel/preset-env']
module.exports = {
  presets: process.env.NODE_ENV === 'production' ? buildPresets : devPresets,
}
