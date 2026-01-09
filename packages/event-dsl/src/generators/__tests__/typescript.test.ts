import { describe, it, expect } from 'vitest';
import { generateTypeScript } from '../typescript';
import type { EventTypeAST } from '../../ast/types';

describe('generateTypeScript', () => {
    it('should generate TypeScript interface for simple fields', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    required: false,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('interface MeetingExtra');
        expect(result).toContain('title: string;');
        expect(result).toContain('description?: string;');
    });

    it('should generate TypeScript interface with all field types', () => {
        const ast: EventTypeAST = {
            type: 'event',
            name: '事件',
            fields: [
                {
                    name: 'name',
                    type: 'string',
                    required: true,
                },
                {
                    name: 'count',
                    type: 'number',
                    required: true,
                },
                {
                    name: 'active',
                    type: 'boolean',
                    required: false,
                },
                {
                    name: 'email',
                    type: 'email',
                    required: false,
                },
                {
                    name: 'tags',
                    type: { type: 'list', itemType: 'string' },
                    required: false,
                },
                {
                    name: 'status',
                    type: { type: 'enum', values: ['pending', 'approved', 'rejected'] },
                    required: false,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('name: string;');
        expect(result).toContain('count: number;');
        expect(result).toContain('active?: boolean;');
        expect(result).toContain('email?: string;');
        expect(result).toContain('tags?: string[];');
        expect(result).toContain("status?: 'pending' | 'approved' | 'rejected';");
    });

    it('should include JSDoc comments when enabled', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            description: '会议事件类型',
            fields: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                    default: 'Untitled',
                    min: 1,
                    max: 100,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast, { includeJSDoc: true });

        expect(result).toContain('/**');
        expect(result).toContain('会议');
        expect(result).toContain('会议事件类型');
        expect(result).toContain('@default "Untitled"');
        expect(result).toContain('@min 1');
        expect(result).toContain('@max 100');
    });

    it('should exclude JSDoc comments when disabled', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [
                {
                    name: 'title',
                    type: 'string',
                    required: true,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast, { includeJSDoc: false });

        expect(result).not.toContain('/**');
        expect(result).toContain('interface MeetingExtra');
    });

    it('should export type when exportType is true', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast, { exportType: true });

        expect(result).toContain('export interface');
    });

    it('should not export type when exportType is false', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast, { exportType: false });

        expect(result).toContain('interface');
        expect(result).not.toContain('export interface');
    });

    it('should use custom type name prefix and suffix', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast, {
            typeNamePrefix: 'Custom',
            typeNameSuffix: 'Data',
        });

        expect(result).toContain('interface CustomMeetingData');
    });

    it('should handle nested list types', () => {
        const ast: EventTypeAST = {
            type: 'event',
            name: '事件',
            fields: [
                {
                    name: 'matrix',
                    type: {
                        type: 'list',
                        itemType: {
                            type: 'list',
                            itemType: 'number',
                        },
                    },
                    required: false,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('matrix?: number[][];');
    });

    it('should handle enum types', () => {
        const ast: EventTypeAST = {
            type: 'event',
            name: '事件',
            fields: [
                {
                    name: 'priority',
                    type: { type: 'enum', values: ['low', 'medium', 'high'] },
                    required: true,
                },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain("priority: 'low' | 'medium' | 'high';");
    });

    it('should handle empty fields array', () => {
        const ast: EventTypeAST = {
            type: 'meeting',
            name: '会议',
            fields: [],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('interface MeetingExtra {');
        expect(result).toContain('}');
    });

    it('should return string for unknown field type', () => {
        const ast: EventTypeAST = {
            type: 'test',
            name: '测试',
            fields: [
                { name: 'unknown', type: 'unknown' as any },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('unknown?: string');
    });

    it('should return unknown for unknown object field type', () => {
        const ast: EventTypeAST = {
            type: 'test',
            name: '测试',
            fields: [
                { name: 'unknown', type: { type: 'unknown' } as any },
            ],
            validate: [],
            display: [],
            behavior: [],
        };

        const result = generateTypeScript(ast);

        expect(result).toContain('unknown?: unknown');
    });
});
