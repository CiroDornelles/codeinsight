class BaseAnalyzer {
  constructor(schema) {
    this.schema = schema;
  }

  async analyze(filePath) {
    throw new Error('analyze() must be implemented by subclasses');
  }

  async readFile(filePath) {
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf-8');
  }

  async getMetrics(content) {
    return {
      lines: content.split('\n').length,
      size: Buffer.from(content).length,
      complexity: this.calculateComplexity(content)
    };
  }

  calculateComplexity(content) {
    // Implementação básica - pode ser sobrescrita por subclasses
    const lines = content.split('\n');
    let complexity = 0;

    for (const line of lines) {
      if (line.includes('if') || 
          line.includes('for') || 
          line.includes('while') ||
          line.includes('switch')) {
        complexity++;
      }
    }

    return complexity;
  }

  async getDependencies(content) {
    return [];
  }

  async getImports(content) {
    return [];
  }

  async getFunctions(content) {
    return [];
  }

  async getClasses(content) {
    return [];
  }
}

module.exports = BaseAnalyzer;
