/**
 * Hardcoded exercise data
 *
 * ANGULAR vs REACT:
 * - In Angular: you might put this in a service with @Injectable
 * - In React: plain data files are fine, no dependency injection needed
 * - Later we can move this to a backend API or local storage
 */

import type { Exercise } from '../types';

export const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Yes, And Circle',
    description: 'Players stand in a circle. One person makes a statement, the next person says "Yes, and..." and adds to the statement. Continue around the circle.',
    tags: ['warmup', 'connection', 'listening', 'heightening'],
  },
  {
    id: '2',
    name: 'Zip Zap Zop',
    description: 'Players stand in a circle and pass energy by pointing and saying "Zip", "Zap", or "Zop" in sequence while making eye contact.',
    tags: ['warmup', 'energy', 'focus', 'connection'],
  },
  {
    id: '3',
    name: 'Object Work',
    description: 'Practice creating and manipulating invisible objects with detail and specificity. Focus on weight, size, texture, and function.',
    tags: ['scene', 'structure', 'focus'],
  },
  {
    id: '4',
    name: 'Emotional Party',
    description: 'One person is the host. Guests arrive one at a time with different emotional states. The host tries to guess the emotion.',
    tags: ['game', 'heightening', 'energy', 'connection'],
  },
  {
    id: '5',
    name: 'Scene Painting',
    description: 'Two players face the audience. The first describes a location in detail. Both players then step into the scene they created.',
    tags: ['scene', 'structure', 'listening', 'heightening'],
  },
  {
    id: '6',
    name: 'One Word Story',
    description: 'The group tells a story together, with each person contributing exactly one word at a time.',
    tags: ['game', 'listening', 'connection', 'structure'],
  },
  {
    id: '7',
    name: 'Energy Ball',
    description: 'Pass an imaginary ball of energy around the circle. Change the size, speed, and quality of the energy.',
    tags: ['warmup', 'energy', 'focus', 'connection'],
  },
  {
    id: '8',
    name: 'Status Walks',
    description: 'Walk around the space embodying different status levels (1 being lowest, 10 being highest). Notice how your body changes.',
    tags: ['scene', 'structure', 'energy', 'focus'],
  },
];
