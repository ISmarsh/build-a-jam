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
    title: 'Yes, And Circle',
    description: 'Players stand in a circle. One person makes a statement, the next person says "Yes, and..." and adds to the statement. Continue around the circle.',
    tags: ['connection', 'listening', 'heightening'],
    duration: 10,
  },
  {
    id: '2',
    title: 'Zip Zap Zop',
    description: 'Players stand in a circle and pass energy by pointing and saying "Zip", "Zap", or "Zop" in sequence while making eye contact.',
    tags: ['energy', 'focus', 'connection'],
    duration: 5,
  },
  {
    id: '3',
    title: 'Object Work',
    description: 'Practice creating and manipulating invisible objects with detail and specificity. Focus on weight, size, texture, and function.',
    tags: ['structure', 'focus'],
    duration: 15,
  },
  {
    id: '4',
    title: 'Emotional Party',
    description: 'One person is the host. Guests arrive one at a time with different emotional states. The host tries to guess the emotion.',
    tags: ['heightening', 'energy', 'connection'],
    duration: 15,
  },
  {
    id: '5',
    title: 'Scene Painting',
    description: 'Two players face the audience. The first describes a location in detail. Both players then step into the scene they created.',
    tags: ['structure', 'listening', 'heightening'],
    duration: 10,
  },
  {
    id: '6',
    title: 'One Word Story',
    description: 'The group tells a story together, with each person contributing exactly one word at a time.',
    tags: ['listening', 'connection', 'structure'],
    duration: 10,
  },
  {
    id: '7',
    title: 'Energy Ball',
    description: 'Pass an imaginary ball of energy around the circle. Change the size, speed, and quality of the energy.',
    tags: ['energy', 'focus', 'connection'],
    duration: 5,
  },
  {
    id: '8',
    title: 'Status Walks',
    description: 'Walk around the space embodying different status levels (1 being lowest, 10 being highest). Notice how your body changes.',
    tags: ['structure', 'energy', 'focus'],
    duration: 10,
  },
];
