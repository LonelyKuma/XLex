import { test, expect } from 'vitest';

import { Reg } from '../src';

test('Simple Reg', () => {
  const dog = new Reg('dog');
  expect(dog.test('dog')).toBeTruthy();
  expect(dog.test('do')).toBeFalsy();
  expect(dog.test('cat')).toBeFalsy();
});

test('Or Reg', () => {
  const abcd = new Reg('(a|b)|(c|d)');
  expect(abcd.test('a')).toBeTruthy();
  expect(abcd.test('b')).toBeTruthy();
  expect(abcd.test('c')).toBeTruthy();
  expect(abcd.test('d')).toBeTruthy();
  expect(abcd.test('e')).toBeFalsy();
  expect(abcd.test('f')).toBeFalsy();
  expect(abcd.test('0')).toBeFalsy();
  expect(abcd.test('9')).toBeFalsy();
});

test('Or Range Reg', () => {
  const numOrLetter = new Reg('[0-9]|[a-z]|[A-Z]');
  for (let i = '0'.charCodeAt(0); i <= '9'.charCodeAt(0); i++) {
    expect(numOrLetter.test(String.fromCharCode(i))).toBeTruthy();
  }
  for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
    expect(numOrLetter.test(String.fromCharCode(i))).toBeTruthy();
  }
  for (let i = 'A'.charCodeAt(0); i <= 'Z'.charCodeAt(0); i++) {
    expect(numOrLetter.test(String.fromCharCode(i))).toBeTruthy();
  }
});

test('Range Reg', () => {
  const punctuation = new Reg('[\\+\\[-\\]]');
  expect(punctuation.test('[')).toBeTruthy();
  expect(punctuation.test('\\')).toBeTruthy();
  expect(punctuation.test(']')).toBeTruthy();
  expect(punctuation.test('+')).toBeTruthy();
});

test('Simple Telephone Number', () => {
  const telephoneNumber = new Reg('[1-9][0-9][0-9][0-9]');
  expect(telephoneNumber.test('1234')).toBeTruthy();
  expect(telephoneNumber.test('0123')).toBeFalsy();
  expect(telephoneNumber.test('123')).toBeFalsy();
});

test('Factor?', () => {
  const intOrFloat = new Reg('[0-9](.[0-9])?');
  expect(intOrFloat.test('1')).toBeTruthy();
  expect(intOrFloat.test('3.6')).toBeTruthy();
  expect(intOrFloat.test('9.')).toBeFalsy();
  expect(intOrFloat.test('666')).toBeFalsy();
  expect(intOrFloat.test('8.88')).toBeFalsy();
});

test('Factor*+', () => {
  const lowerCaseLetters = new Reg('[a-z]+');
  expect(lowerCaseLetters.test('abcdefgh')).toBeTruthy();
  expect(lowerCaseLetters.test('12345678')).toBeFalsy();
  const ID = new Reg('[a-zA-Z][a-zA-Z0-9]*');
  expect(ID.test('a')).toBeTruthy();
  expect(ID.test('x1c')).toBeTruthy();
  expect(ID.test('1A')).toBeFalsy();

  const numberReg = new Reg('[0-9]+[0-9]*');
  expect(numberReg.test('0123456789')).toBeTruthy();
  expect(numberReg.test('abc123')).toBeFalsy();
  expect(numberReg.test('0123xyz')).toBeFalsy();
});

test('Error Handler', () => {
  expect(() => new Reg('')).toThrow('Text can not be empty');
  expect(() => new Reg('[1-9')).toThrow('Unexpected EOF');
  expect(() => new Reg('+5')).toThrow('Unexpected Letter +');
});
