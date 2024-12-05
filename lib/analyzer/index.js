const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const Ajv = require('ajv');

class ProjectAnalyzer {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    this.schemas = new Map();
    this.analyzers = new Map();
    this.cache = new Map();
  }

  async initialize() {
    // Carrega todos os schemas disponíveis
    const schemaDir = path.join(__dirname, 'schemas');
    const schemaFiles = glob.sync('*.json', { cwd: schemaDir });
    
    for (const file of schemaFiles) {
      const schema = require(path.join(schemaDir, file));
      this.schemas.set(schema.name, schema);
      this.ajv.addSchema(schema);
    }
  }

  async detectProjectType(projectPath) {
    const files = await fs.readdir(projectPath);
    const detectors = {
      'javascript': {
        files: ['package.json', 'webpack.config.js', 'next.config.js'],
        patterns: ['*.js', '*.jsx', '*.ts', '*.tsx']
      },
      'python': {
        files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
        patterns: ['*.py']
      },
      // Adicione mais detectores conforme necessário
    };

    for (const [type, detector] of Object.entries(detectors)) {
      const hasFiles = detector.files.some(f => files.includes(f));
      const hasPatterns = detector.patterns.some(p => 
        files.some(f => f.match(new RegExp(p.replace('*', '.*'))))
      );

      if (hasFiles || hasPatterns) {
        return type;
      }
    }

    return 'generic';
  }

  async loadAnalyzer(type) {
    if (this.analyzers.has(type)) {
      return this.analyzers.get(type);
    }

    try {
      const schema = this.schemas.get(`${type}Schema`);
      const AnalyzerClass = require(`./analyzers/${type}`);
      const analyzer = new AnalyzerClass(schema);
      this.analyzers.set(type, analyzer);
      return analyzer;
    } catch (error) {
      console.warn(`Warning: No analyzer found for type ${type}, using generic analyzer`);
      const GenericAnalyzer = require('./analyzers/base');
      return new GenericAnalyzer(this.schemas.get('BaseProjectSchema'));
    }
  }

  async analyze(projectPath) {
    const projectType = await this.detectProjectType(projectPath);
    const analyzer = await this.loadAnalyzer(projectType);
    
    const result = {
      projectType,
      files: {},
      relationships: new Map(),
      metrics: {
        totalFiles: 0,
        totalLines: 0,
        totalFunctions: 0,
        totalClasses: 0,
        complexity: 0
      }
    };

    const schema = this.schemas.get(`${projectType}Schema`);
    const patterns = schema?.filePatterns || ['**/*.*'];
    const files = glob.sync(patterns, { 
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**']
    });

    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const analysis = await analyzer.analyze(filePath);
      
      result.files[file] = analysis;
      this.updateMetrics(result.metrics, analysis);
      this.updateRelationships(result.relationships, file, analysis);
    }

    return result;
  }

  updateMetrics(metrics, fileAnalysis) {
    metrics.totalFiles++;
    metrics.totalLines += fileAnalysis.metrics.lines;
    metrics.totalFunctions += fileAnalysis.functions.length;
    metrics.totalClasses += fileAnalysis.classes.length;
    metrics.complexity += fileAnalysis.metrics.complexity;
  }

  updateRelationships(relationships, file, analysis) {
    // Adiciona relacionamentos baseados em imports
    for (const imp of analysis.imports) {
      const key = `${file}:${imp.source}`;
      if (!relationships.has(key)) {
        relationships.set(key, {
          from: file,
          to: imp.source,
          type: 'import',
          items: []
        });
      }
      
      if (imp.specifiers) {
        relationships.get(key).items.push(...imp.specifiers);
      }
    }
  }

  async generateReport(analysis, outputPath) {
    const report = {
      summary: {
        projectType: analysis.projectType,
        metrics: analysis.metrics,
        fileCount: Object.keys(analysis.files).length,
        relationships: analysis.relationships.size
      },
      files: analysis.files,
      relationships: Array.from(analysis.relationships.values())
    };

    await fs.mkdir(outputPath, { recursive: true });
    await fs.writeFile(
      path.join(outputPath, 'analysis.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }
}

module.exports = { ProjectAnalyzer };
