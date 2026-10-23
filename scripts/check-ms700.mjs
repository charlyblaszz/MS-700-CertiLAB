import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = process.cwd();
const runtime = path.join(root, 'work', 'checks');
await fs.mkdir(runtime, { recursive: true });
const modules = ['types', 'utils/random', 'utils/scoring', 'services/questionService', 'store/useSimulatorStore'];
for (const name of modules) {
  const input = await fs.readFile(path.join(root, 'src', name + '.ts'), 'utf8');
  let code = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  code = code.replace(/(["'])@\/src\/([^"']+)\1/g, (_, quote, ref) => quote + pathToFileURL(path.join(runtime, ref + '.mjs')).href + quote);
  await fs.mkdir(path.dirname(path.join(runtime, name)), { recursive: true });
  await fs.writeFile(path.join(runtime, name + '.mjs'), code);
}
const saved = new Map();
globalThis.localStorage = { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v), removeItem: k => saved.delete(k) };
const { normalizeQuestionBank } = await import(pathToFileURL(path.join(runtime, 'services/questionService.mjs')));
const { scoreQuestion, buildExamResult, isAnswered } = await import(pathToFileURL(path.join(runtime, 'utils/scoring.mjs')));
const { useSimulatorStore } = await import(pathToFileURL(path.join(runtime, 'store/useSimulatorStore.mjs')));
const payload = JSON.parse(await fs.readFile('public/data/ms700.es.json', 'utf8'));
const result = normalizeQuestionBank(payload);
assert.deepEqual(result.warnings, []);
assert.equal(result.questions.length, 399);
assert.equal(new Set(result.questions.map(q => q.id)).size, 399);
assert.deepEqual(result.questions.map(q => q.sourceId).sort((a,b) => a-b), Array.from({length:399},(_,i)=>i+1));
assert.equal(result.questions.filter(q => q.type === 'practical').length, 155);
for (const q of result.questions) {
  assert.ok(q.prompt.trim());
  assert.ok(q.sourcePages.length);
  assert.ok(!/QZX\d{4}XZQ|\[880\d{4}\]|⟦7788\d{4}⟧/i.test(JSON.stringify(q)), 'Unrestored translation token');
  if (q.type === 'multiple_choice' || q.type === 'multiple_choice_multi_select') {
    assert.ok(q.options.length >= 2);
    const keys = q.type === 'multiple_choice' ? [q.correctAnswer] : q.correctAnswers;
    assert.ok(keys.every(key => q.options.some(option => option.id === key)));
    assert.equal(scoreQuestion(q, q.type === 'multiple_choice' ? q.correctAnswer : q.correctAnswers).score, 1);
  }
  for (const figure of [...q.figures, ...q.solutionFigures]) await fs.access(path.join(root, 'public', figure.src));
}
const practical = result.questions.find(q => q.type === 'practical');
const choice = result.questions.find(q => q.type === 'multiple_choice');
assert.equal(scoreQuestion(practical, {notes:'Pasos',reviewed:true}).maxScore,0);
assert.equal(isAnswered(practical,{notes:'',reviewed:true}),false);
assert.equal(isAnswered(practical,{notes:'Pasos',reviewed:false}),false);
assert.equal(isAnswered(practical,{notes:'Pasos',reviewed:true}),true);
const session = { id:'test', seed:1, mode:'study', pearsonMode:false, questionIds:[practical.id,choice.id], answers:{[practical.id]:{notes:'Pasos',reviewed:true},[choice.id]:choice.correctAnswer}, reviewIds:[], revealedIds:[], currentIndex:0, startedAt:Date.now(), status:'active' };
const mixed = buildExamResult(session,[practical,choice],700);
assert.equal(mixed.maxScore,1);
assert.equal(mixed.percentage,100);
assert.equal(mixed.incorrectCount,0);
assert.equal(mixed.completedPracticeCount,1);
const practiceResult = buildExamResult({...session,questionIds:[practical.id]},[practical],700);
assert.equal(practiceResult.passed,false);
assert.equal(practiceResult.maxScore,0);
const store = useSimulatorStore;
store.getState().hydrateBank(result.questions,[],'MS-700');
store.getState().startExam({mode:'exam',count:'all'});
assert.equal(store.getState().session.questionIds.length,244);
store.getState().updateSettings({pearsonMode:true});
store.getState().startExam({mode:'study',count:'all',practiceOnly:true});
assert.equal(store.getState().session.questionIds.length,155);
assert.equal(store.getState().session.pearsonMode,false);
store.getState().startExam({mode:'study',count:'all',practiceOnly:true,practiceKind:'simulation'});
assert.equal(store.getState().session.questionIds.length,24);
store.getState().startExam({mode:'study',count:'all',practiceOnly:true,practiceKind:'visual'});
assert.equal(store.getState().session.questionIds.length,131);
store.getState().setAnswer(practical.id,{notes:'Mi respuesta',reviewed:false});
assert.ok(!store.getState().session.revealedIds.includes(practical.id));
store.getState().selectIncludedBank('ab900');
assert.equal(store.getState().customBank,null);
assert.equal(store.getState().session,null);
console.log('PASS: 399 preguntas, claves, figuras, importación, puntuación mixta, prácticas sin puntos y selección de bancos.');
