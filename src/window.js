import { hasVal, toUpper } from './util'
import { exprToSQL, orderOrPartitionByToSQL } from './expr'
import { overToSQL } from './over'

function windowFrameExprToSQL(windowFrameExpr) {
  if (!windowFrameExpr) return
  const { type } = windowFrameExpr
  if (type === 'rows') {
    return [toUpper(type), exprToSQL(windowFrameExpr.expr)].filter(hasVal).join(' ')
  }
  return exprToSQL(windowFrameExpr)
}
function windowSpecificationToSQL(windowSpec) {
  const {
    name,
    partitionby,
    orderby,
    window_frame_clause: windowFrame,
  } = windowSpec
  const result = [
    name,
    orderOrPartitionByToSQL(partitionby, 'partition by'),
    orderOrPartitionByToSQL(orderby, 'order by'),
    windowFrameExprToSQL(windowFrame),
  ]
  return result.filter(hasVal).join(' ')
}

function asWindowSpecToSQL(asWindowSpec) {
  if (typeof asWindowSpec === 'string') return asWindowSpec
  const { window_specification: windowSpec } = asWindowSpec
  return `(${windowSpecificationToSQL(windowSpec)})`
}

function namedWindowExprToSQL(namedWindowExpr) {
  const { name, as_window_specification: asWindowSpec } = namedWindowExpr
  return `${name} AS ${asWindowSpecToSQL(asWindowSpec)}`
}

function namedWindowExprListToSQL(namedWindowExprInfo) {
  const { expr } = namedWindowExprInfo
  return expr.map(namedWindowExprToSQL).join(', ')
}

function constructArgsList(expr) {
  const { args, name, consider_nulls = '', separator = ', ' } = expr
  const argsList = args ? exprToSQL(args).join(separator) : ''
  // cover Syntax from FN_NAME(...args [RESPECT NULLS]) [RESPECT NULLS]
  const result = [name, '(', argsList, ')', consider_nulls && ' ', consider_nulls]
  return result.filter(hasVal).join('')
}

function windowFuncToSQL(expr) {
  const { over } = expr
  const str = constructArgsList(expr)
  const overStr = overToSQL(over)
  return [str, overStr].filter(hasVal).join(' ')
}

export {
  asWindowSpecToSQL,
  namedWindowExprToSQL,
  namedWindowExprListToSQL,
  windowFuncToSQL,
  windowSpecificationToSQL,
}
