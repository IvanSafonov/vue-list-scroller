const eps = 0.05

const isNumber = (...values) =>
  values.every((value) => typeof value == 'number')

export const pxEq = (first, second) => {
  return isNumber(first, second) && Math.abs(first - second) < eps
}

export const pxGt = (first, second) => {
  return isNumber(first, second) && first - second > eps
}
