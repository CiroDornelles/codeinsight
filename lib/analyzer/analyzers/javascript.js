const BaseAnalyzer = require('./base');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class JavaScriptAnalyzer extends BaseAnalyzer {
  constructor(schema) {
    super(schema);
    this.ast = null;
  }

  async analyze(filePath) {
    const content = await this.readFile(filePath);
    
    try {
      this.ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators']
      });
    } catch (error) {
      console.warn(`Warning: Failed to parse ${filePath}: ${error.message}`);
      return this.getBasicAnalysis(content);
    }

    const analysis = {
      imports: await this.getImports(),
      exports: await this.getExports(),
      functions: await this.getFunctions(),
      classes: await this.getClasses(),
      metrics: await this.getMetrics(content),
      dependencies: await this.getDependencies(content)
    };

    return analysis;
  }

  async getBasicAnalysis(content) {
    return {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      metrics: await this.getMetrics(content),
      dependencies: []
    };
  }

  async getImports() {
    const imports = [];
    
    traverse(this.ast, {
      ImportDeclaration(path) {
        imports.push({
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => ({
            type: spec.type,
            name: spec.local.name,
            imported: spec.imported?.name
          }))
        });
      },
      CallExpression(path) {
        if (path.node.callee.name === 'require') {
          imports.push({
            source: path.node.arguments[0].value,
            type: 'require'
          });
        }
      }
    });

    return imports;
  }

  async getExports() {
    const exports = [];

    traverse(this.ast, {
      ExportDefaultDeclaration(path) {
        exports.push({
          type: 'default',
          name: path.node.declaration.name || 'default'
        });
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration) {
          const declaration = path.node.declaration;
          exports.push({
            type: 'named',
            name: declaration.id?.name || declaration.declarations?.[0]?.id?.name
          });
        }
      }
    });

    return exports;
  }

  async getFunctions() {
    const functions = [];

    traverse(this.ast, {
      FunctionDeclaration(path) {
        functions.push({
          name: path.node.id.name,
          params: path.node.params.map(p => p.name),
          async: path.node.async,
          location: path.node.loc
        });
      },
      ArrowFunctionExpression(path) {
        const parent = path.findParent(p => p.isVariableDeclarator());
        if (parent) {
          functions.push({
            name: parent.node.id.name,
            params: path.node.params.map(p => p.name),
            async: path.node.async,
            arrow: true,
            location: path.node.loc
          });
        }
      }
    });

    return functions;
  }

  async getClasses() {
    const classes = [];

    traverse(this.ast, {
      ClassDeclaration(path) {
        const methods = path.node.body.body
          .filter(node => node.type === 'ClassMethod')
          .map(node => ({
            name: node.key.name,
            params: node.params.map(p => p.name),
            async: node.async,
            kind: node.kind
          }));

        classes.push({
          name: path.node.id.name,
          superClass: path.node.superClass?.name,
          methods,
          location: path.node.loc
        });
      }
    });

    return classes;
  }

  calculateComplexity(content) {
    let complexity = 0;
    
    traverse(this.ast, {
      IfStatement() { complexity++; },
      ForStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      SwitchCase() { complexity++; },
      ConditionalExpression() { complexity++; },
      LogicalExpression() { complexity++; }
    });

    return complexity;
  }
}

module.exports = JavaScriptAnalyzer;
