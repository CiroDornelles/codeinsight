#!/usr/bin/env node
const { program } = require('commander');
const { ProjectAnalyzer } = require('../lib/analyzer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

program
  .name('codeinsight')
  .description('Universal code analysis tool')
  .version('1.0.0')
  .helpOption('-h, --help', 'Display help for command');

program
  .command('analyze')
  .description('Analyze current project')
  .option('-t, --type <type>', 'Force project type')
  .option('-o, --output <dir>', 'Output directory', '.codeinsight')
  .action(async (options) => {
    const spinner = ora('Analyzing project...').start();
    try {
      const analyzer = new ProjectAnalyzer();
      await analyzer.initialize();

      const projectPath = process.cwd();
      const analysis = await analyzer.analyze(projectPath);

      await generateDocs(analysis, options.output);
      
      spinner.succeed('Analysis complete!');
      showSummary(analysis);
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error.message));
    }
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ codeinsight analyze');
    console.log('  $ codeinsight analyze -t javascript');
    console.log('  $ codeinsight analyze -o ./output');
  });

program
  .command('explore')
  .description('Explore project interactively')
  .action(async () => {
    const choices = [
      'View file details',
      'Search functions',
      'Show dependencies',
      'Show metrics',
      'Exit'
    ];

    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to explore?',
          choices
        }
      ]);

      if (action === 'Exit') break;
      await handleAction(action);
    }
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ codeinsight explore');
  });

// Show help if no arguments are provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
