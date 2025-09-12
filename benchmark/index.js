const Benchmark = require('benchmark');
const plugin = require('../dist');

const suite = new Benchmark.Suite;

// Benchmark rule processing
suite.add('Process rule', () => {
  const mockRule = {
    meta: { fixable: 'code' },
    create: () => ({})
  };
  plugin.rules['benchmark-rule'] = plugin.disableFix(mockRule);
})

// Benchmark plugin loading
.add('Load plugin', () => {
  require('../dist');
})

.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
