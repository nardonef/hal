/**
 * @fileOverview Entity to resource test
 */
const {expect} = require('chai');
const {entities, entityGenerator} = require('@nterprise/api-sdk');
const {HalResource, HalLink} = require('../src');
const entityToResourceFactory = require('../src/entityToResource');

describe('Entity To Resource', () => {
    let config = {};

    it('Converts an entity to a resource with no links', () => {
        const entity = new entities['Entity']({
            id: 'ce992db3-4f33-46c2-b608-f0c4c8d0495a',
        });

        config = {
            'entityConfig': {
                'Entity': {
                    'hal': {
                        'rel': 'fizz',
                        'links': [],
                    },
                },
            },
        };

        const {entityToResource} = entityToResourceFactory(config);
        const actualResource = entityToResource(entity);
        const expectedResource = new HalResource('fizz', entity.toObject());
        expect(actualResource).deep.eq(expectedResource);
    });

    it('Converts an entity to a resource with links', () => {
        const entity = new entities['Entity']({
            id: 'ce992db3-4f33-46c2-b608-f0c4c8d0495a',
        });

        config = {
            'entityConfig': {
                'Entity': {
                    'hal': {
                        'rel': 'fizz',
                        'links': [
                            ['nter:foo', {'href': '/bar'}],
                        ],
                    },
                },
            },
        };

        const {entityToResource} = entityToResourceFactory(config);
        const actualResource = entityToResource(entity);
        const expectedResource = new HalResource('fizz', entity.toObject());
        expectedResource.addLink(new HalLink('nter:foo', {'href': '/bar'}));
        expect(actualResource).deep.eq(expectedResource);
    });

    it('Throws exception when entity not in config', () => {
        const entity = new entities['Entity']({
            id: 'ce992db3-4f33-46c2-b608-f0c4c8d0495a',
        });

        config = {
            'entityConfig': {},
        };

        const {entityToResource} = entityToResourceFactory(config);
        try {
            entityToResource(entity);
            expect.fail('Exception not thrown');
        } catch (error) {
            expect(error.message).to.eq('Invalid HAL configured for entity');
        }
    });

    it('Converts generator to collection with no offset', () => {
        const data = [
            {id: '4d1612c6-9efc-4b46-ad56-41d13768d5d9'},
            {id: 'c91ab5a1-e486-4c63-9d22-39aee9f714f8'},
        ];

        const iterator = entityGenerator(
            data,
            42,
            null,
            entities['Entity'],
        );

        config = {
            'entityConfig': {
                'Entity': {
                    'hal': {
                        'rel': 'fizz',
                        'links': [],
                    },
                },
            },
        };

        const {entitiesToCollection} = entityToResourceFactory(config);
        const actualCollection = entitiesToCollection(
            entities['Entity'],
            iterator,
            '/fizz',
        );

        const expectedCollection = new HalResource(
            'fizz',
            {
                'total_count': 42,
                'offset': null,
                'limit': 2,
            },
            true,
        );

        expectedCollection.addEmbed(
            new HalResource(
                'fizz',
                new entities['Entity'](data[0]).toObject(),
            ),
        );
        expectedCollection.addEmbed(
            new HalResource(
                'fizz',
                new entities['Entity'](data[1]).toObject(),
            ),
        );

        expect(actualCollection).deep.eq(expectedCollection);
    });

    it('Converts generator to collection with offset', () => {
        const data = [
            {id: '4d1612c6-9efc-4b46-ad56-41d13768d5d9'},
            {id: 'c91ab5a1-e486-4c63-9d22-39aee9f714f8'},
        ];

        const iterator = entityGenerator(
            data,
            42,
            'buzz',
            entities['Entity'],
        );

        config = {
            'entityConfig': {
                'Entity': {
                    'hal': {
                        'rel': 'fizz',
                        'links': [],
                    },
                },
            },
        };

        const {entitiesToCollection} = entityToResourceFactory(config);
        const actualCollection = entitiesToCollection(
            entities['Entity'],
            iterator,
            '/fizz',
        );

        const expectedCollection = new HalResource(
            'fizz',
            {
                'total_count': 42,
                'offset': 'buzz',
                'limit': 2,
            },
            true,
        );

        expectedCollection.addEmbed(
            new HalResource(
                'fizz',
                new entities['Entity'](data[0]).toObject(),
            ),
        );
        expectedCollection.addEmbed(
            new HalResource(
                'fizz',
                new entities['Entity'](data[1]).toObject(),
            ),
        );

        expectedCollection.addLink(
            new HalLink(
                'next',
                {
                    href: '/fizz',
                    query: {
                        limit: 2,
                        offset: 'buzz',
                    },
                },
            ),
        );

        expect(actualCollection).deep.eq(expectedCollection);
    });

    it('Should add assigned entities to links', () => {
        const entity = new entities['Entity']({
            id: 'ce992db3-4f33-46c2-b608-f0c4c8d0495a',
            assigned_to: [
                'FOO:a6ea74cc-3ce3-4c50-8116-f8f93a70470b',
                'BAR:b4996f59-2d67-4aeb-b7d9-bc2b15eb98ba',
            ],
        });

        config = {
            pathMap: {
                '/foos': {entity: 'Footity'},
                '/bars': {entity: 'Bartity'},
            },
            entityConfig: {
                Entity: {
                    type: 'NAE',
                    hal: {rel: 'fizz'},
                },
                Footity: {
                    'type': 'FOO',
                    'hal': {rel: 'baz'},
                },
                Bartity: {
                    type: 'BAR',
                    hal: {rel: 'buzz'},
                },
            },
        };

        const {entityToResource} = entityToResourceFactory(config);
        const actualResource = entityToResource(entity);
        const expectedResource = new HalResource('fizz', entity.toObject());
        expectedResource.addLink(new HalLink(
            'baz', {href: '/foos/a6ea74cc-3ce3-4c50-8116-f8f93a70470b'}
        ));
        expectedResource.addLink(new HalLink(
            'buzz', {href: '/bars/b4996f59-2d67-4aeb-b7d9-bc2b15eb98ba'}
        ));
        expect(actualResource).deep.eq(expectedResource);
    });
});
