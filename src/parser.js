import { columnToSQL, getDual } from './column'
import { exprToSQL } from './expr'
import parsers from './parser.all'
import astToSQL from './sql'
import { DEFAULT_OPT, setParserOpt } from './util'

class Parser {
  astify(sql, opt = DEFAULT_OPT) {
    const astInfo = this.parse(sql, opt)
    return astInfo && astInfo.ast
  }

  sqlify(ast, opt = DEFAULT_OPT) {
    setParserOpt(opt)
    return astToSQL(ast, opt)
  }

  exprToSQL(expr, opt = DEFAULT_OPT) {
    setParserOpt(opt)
    return exprToSQL(expr)
  }

  columnsToSQL(columns, tables, opt = DEFAULT_OPT) {
    setParserOpt(opt)
    if (!columns || columns === '*') return []
    const isDual = getDual(tables)
    return columns.map(col => columnToSQL(col, isDual))
  }

  parse(sql, opt = DEFAULT_OPT) {
    const { database = (PARSER_NAME || 'mysql') } = opt
    setParserOpt(opt)
    const typeCase = database.toLowerCase()
    if (parsers[typeCase]) return parsers[typeCase](opt.trimQuery === false ? sql : sql.trim(), opt.parseOptions || DEFAULT_OPT.parseOptions)
    throw new Error(`${database} is not supported currently`)
  }

  whiteListCheck(sql, whiteList, opt = DEFAULT_OPT) {
    if (!whiteList || whiteList.length === 0) return
    const { type = 'table' } = opt
    if (!this[`${type}List`] || typeof this[`${type}List`] !== 'function') throw new Error(`${type} is not valid check mode`)
    const checkFun = this[`${type}List`].bind(this)
    const authorityList = checkFun(sql, opt)
    let hasAuthority = true
    let denyInfo = ''
    for (const authority of authorityList) {
      let hasCorrespondingAuthority = false
      for (const whiteAuthority of whiteList) {
        const regex = new RegExp(`^${whiteAuthority}$`, 'i')
        if (regex.test(authority)) {
          hasCorrespondingAuthority = true
          break
        }
      }
      if (!hasCorrespondingAuthority) {
        denyInfo = authority
        hasAuthority = false
        break
      }
    }
    if (!hasAuthority) throw new Error(`authority = '${denyInfo}' is required in ${type} whiteList to execute SQL = '${sql}'`)
  }

  tableList(sql, opt) {
    const astInfo = this.parse(sql, opt)
    return astInfo && astInfo.tableList
  }

  columnList(sql, opt) {
    const astInfo = this.parse(sql, opt)
    return astInfo && astInfo.columnList
  }
}

export default Parser
