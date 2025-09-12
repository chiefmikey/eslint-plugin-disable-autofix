import Benchmark from 'benchmark';
import plugin, { disableFix } from '../src';

describe('Performance benchmarks', () => {
  it('should benchmark rule processing', (done) => {
    const suite = new Benchmark.Suite();
    const results: string[] = [];

    suite
      .add('Process rule', () => {
        const mockRule = {
          meta: { fixable: 'code' as const },
          create: () => ({}),
        };
        plugin.rules['benchmark-rule'] = disableFix(mockRule);
      })
      .add('Load plugin', () => {
        require('../src');
      })
      .on('cycle', (event: Benchmark.Event) => {
        results.push(String(event.target));
      })
      .on('complete', function (this: Benchmark.Suite) {
        console.log('Benchmark Results:');
        results.forEach((result) => console.log(result));
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        done();
      })
      .run({ async: true });
  }, 10000); // 10 second timeout
});
