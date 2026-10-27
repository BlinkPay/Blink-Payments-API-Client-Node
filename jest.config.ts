import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).ts?(x)', '**/integrationTests/**/*.[jt]s?(x)'],

    // Stop Jest discovering copies of the repo (e.g. Claude Code worktrees) and the build output
    modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/dist/'],

    // TS is compiled by ts-jest
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }],
    },

    // lcov is what SonarCloud reads in CI; run locally with `npm test -- --coverage`
    coverageReporters: ['lcov', 'text-summary'],
    collectCoverageFrom: ['src/**/*.ts', '*.ts', '!jest.config.ts'],
    // The DTOs are generated from the OpenAPI spec, so covering them tests the generator.
    // Sonar drops them through sonar.coverage.exclusions; this keeps Aikido's figure aligned.
    coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/dto/'],

    // Help Jest resolve ".js" extension in TypeScript imports
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
};

export default config;
