/**
 * @fileOverview Test for the HalResource
 */
const {expect} = require('chai');
const httpErrors = require('http-errors');
const {
    HalLink,
    HalResource,
} = require('../src');

describe('Hal Renderer', () => {
    const halOptions = {
        'api_base': 'https://api.example.com',
        'build_link_header': false,
        'entity_definitions': [
            {
                'entity_type': 'fizz',
                'collection_type': 'fizzes',
                'version': 'v1',
                'entity_path': '/fizzes/:fizz_id',
                'collection_path': '/fizzes',
                'collection_query': [
                    'page',
                    'per_page',
                    'sort',
                ],
                'collection_map': {
                    'page': 'page',
                    'total_count': 'total_count',
                    'per_page': 'per_page',
                },
                'entity_map': {
                    'FID': 'fizz_id',
                    'fizzName': 'name',
                },
            },
            {
                'entity_type': 'buzz',
                'collection_type': 'buzzes',
                'version': 'v1',
                'entity_path': '/buzzes/:buzz_id',
                'collection_path': '/buzzes',
                'collection_query': [
                    'page',
                    'per_page',
                    'sort',
                    'filter[label]',
                    'filter[active]',
                ],
                'collection_map': {
                    'page': 'page',
                    'total_count': 'total_count',
                    'per_page': 'per_page',
                },
                'entity_map': {
                    'BID': 'buzz_id',
                    'FID': 'fizz_id',
                    'buzzLabel': 'label',
                    'isActive': 'active',
                },
            },
            {
                'entity_type': 'foo',
                'collection_type': 'foos',
                'version': 'v1',
                'entity_path': '/foos/:foo_id',
                'collection_path': '/foos',
                'collection_query': [
                    'page',
                    'per_page',
                    'sort',
                    'filter[title]',
                ],
                'collection_map': {
                    'page': 'page',
                    'total_count': 'total_count',
                    'per_page': 'per_page',
                },
                'entity_map': {
                    'foo_id': 'foo_id',
                    'FID': 'fizz_id',
                    'title': 'title',
                },
            },
        ],
    };

    const render = require('../src/halRenderer').halRender(halOptions);

    context('Resources', () => {
        it('Should render Resource without embeds', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    'fizz_id': '42',
                    'name': 'manchuck',
                },
            });
        });

        it('Should render Resource with default properties', () => {
            const resource = new HalResource(
                'fizz',
                {fizz_id: 42},
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    'fizz_id': 42,
                    'name': null,
                },
            });
        });

        it('Should render Resource with one embed type', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            resource.addEmbed(new HalResource(
                'buzz',
                {'FID': '42', 'BID': '84', 'label': 'zones', 'active': false},
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    '_embedded': {
                        'buzzes': [
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/buzzes/84',
                                    },
                                },
                                'active': false,
                                'buzz_id': '84',
                                'fizz_id': '42',
                                'label': 'zones',
                            },
                        ],
                    },
                    'fizz_id': '42',
                    'name': 'manchuck',
                },
            });
        });

        it('Should render Resource with embed defaults', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            resource.addEmbed(new HalResource(
                'buzz',
                {'BID': '84'},
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    '_embedded': {
                        'buzzes': [
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/buzzes/84',
                                    },
                                },
                                'active': null,
                                'buzz_id': '84',
                                'fizz_id': null,
                                'label': null,
                            },
                        ],
                    },
                    'fizz_id': '42',
                    'name': 'manchuck',
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render Resource with multiple embeds the same type', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            resource.addEmbed(new HalResource(
                'buzz',
                {'FID': '42', 'BID': '84', 'label': 'zones'},
            ));

            resource.addEmbed(new HalResource(
                'buzz',
                {'FID': '42', 'BID': '126', 'label': 'zones'},
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    '_embedded': {
                        'buzzes': [
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/buzzes/84',
                                    },
                                },
                                'active': null,
                                'buzz_id': '84',
                                'fizz_id': '42',
                                'label': 'zones',
                            },
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/buzzes/126',
                                    },
                                },
                                'active': null,
                                'buzz_id': '126',
                                'fizz_id': '42',
                                'label': 'zones',
                            },
                        ],
                    },
                    'fizz_id': '42',
                    'name': 'manchuck',
                },
            });
        });

        it('Should render Resource with multiple embed types', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            resource.addEmbed(new HalResource(
                'buzz',
                {'FID': '42', 'BID': '84', 'label': 'zones'},
            ));

            resource.addEmbed(new HalResource(
                'foo',
                {
                    'foo_id': '126',
                    'fizz_id': '42',
                    'title': 'I pity the foo!',
                },
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    '_embedded': {
                        'buzzes': [
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/buzzes/84',
                                    },
                                },
                                'active': null,
                                'buzz_id': '84',
                                'fizz_id': '42',
                                'label': 'zones',
                            },
                        ],
                        'foos': [
                            {
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/foos/126',
                                    },
                                },
                                'foo_id': '126',
                                'fizz_id': '42',
                                'title': 'I pity the foo!',
                            },
                        ],
                    },
                    'fizz_id': '42',
                    'name': 'manchuck',
                },
            });
        });

        it('Should render Error when resource is not configured', () => {
            const resource = new HalResource(
                'manchuck',
                {},
            );

            expect(render.bind(expect, resource)).to.throw(
                httpErrors.UnsupportedMediaType,
                'Invalid resource type: manchuck'
            );
        });

        // eslint-disable-next-line max-len
        it('Should render Error when embedded resource is not configured', () => {
            const resource = new HalResource(
                'fizz',
                {},
            );

            resource.addEmbed(new HalResource('manchuck', {}));

            expect(render.bind(expect, resource)).to.throw(
                Error,
                'Resource is missing required property'
            );
        });

        it('Should render Error when HalResource not passed', () => {
            expect(render.bind(expect, {})).to.throw(
                Error,
                'Invalid resource type: undefined'
            );
        });
    });

    context('Collections', () => {
        it('Should render collection', () => {
            const collection = new HalResource(
                'fizz',
                {'total_count': 2, 'page': 1, 'per_page': 2},
                true,
            );

            collection.addEmbed(new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            ));

            collection.addEmbed(new HalResource(
                'fizz',
                {'FID': '84', 'fizzName': 'zones'},
            ));

            expect(render(collection)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/fizzes',
                        },
                    },
                    '_embedded': {
                        'fizzes': [
                            {
                                'fizz_id': '42',
                                'name': 'manchuck',
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/fizzes/42',
                                    },
                                },
                            },
                            {
                                'fizz_id': '84',
                                'name': 'zones',
                                '_links': {
                                    'self': {
                                        'href': 'https://api.example.com/fizzes/84',
                                    },
                                },
                            },
                        ],
                    },
                    'total_count': 2,
                    'page': 1,
                    'per_page': 2,
                },
            });
        });

        it('Should render empty collection and filter params', () => {
            const collection = new HalResource(
                'buzz',
                {'total_count': 0, 'page': 1, 'per_page': 2},
                true,
            );

            expect(render(collection)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                    },
                    '_embedded': {},
                    'total_count': 0,
                    'page': 1,
                    'per_page': 2,
                },
            });
        });
    });

    context('Links', () => {
        it('Should render resource link', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(new HalLink('nter:fizz', '/fizzes/:fizz_id'));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render resource link with query parameters', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(new HalLink(
                'nter:fizz',
                {
                    'href': '/fizzes/:fizz_id',
                    'query': {
                        'page': 2,
                        'per_page': 50,
                        'filter': {
                            'label': 'manchuck',
                        },
                    },
                },
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/42?page=2&per_page=50&filter%5Blabel%5D=manchuck',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render collection link with query parameters', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'total_count': 42,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(new HalLink(
                'next',
                {
                    'href': '/fizzes/42',
                    'query': {
                        'page': 2,
                        'per_page': 50,
                    },
                },
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/fizzes/42?page=2&per_page=50',
                        },
                    },
                    '_embedded': {},
                    'total_count': 42,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render collection link with non extracted properties', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'fizz_id': 42,
                    'total_count': 42,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(new HalLink(
                'next',
                {
                    'href': '/fizzes/:fizz_id/buzzes',
                    'query': {
                        'page': 2,
                        'per_page': 50,
                    },
                },
            ));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/fizzes/42/buzzes?page=2&per_page=50',
                        },
                    },
                    '_embedded': {},
                    'total_count': 42,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        it('Should render multiple resource links', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(new HalLink('nter:fizz', '/fizzes/:fizz_id'));
            resource.addLink(new HalLink('nter:foo', '/foo/bar'));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                        'nter:foo': {
                            'href': 'https://api.example.com/foo/bar',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render templated links', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(
                new HalLink(
                    'nter:fizz', {
                        'href': '/fizzes/{fizz_id}',
                        'templated': true,
                    },
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/{fizz_id}',
                            'templated': true,
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render links with query string [NTER-1310]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(
                new HalLink(
                    'next',
                    '/buzzes?page=2',
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/buzzes?page=2',
                        },
                    },
                    '_embedded': {},
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render link with query string by using the property [NTER-1310]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(
                new HalLink(
                    'next',
                    {
                        href: '/buzzes?page=2',
                        query: {
                            page: 5,
                            per_page: 50,
                        },
                    },
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/buzzes?page=5&per_page=50',
                        },
                    },
                    '_embedded': {},
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render link by merging href query and query property [NTER-1310]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(
                new HalLink(
                    'next',
                    {
                        href: '/buzzes?page=2&fizz=buzz',
                        query: {
                            page: 5,
                            per_page: 50,
                        },
                    },
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/buzzes?page=5&per_page=50&fizz=buzz',
                        },
                    },
                    '_embedded': {},
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render link by overiding href query and query property [NTER-1310]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
                true,
            );

            resource.addLink(
                new HalLink(
                    'next',
                    {
                        href: '/buzzes?page=2',
                        query: {
                            page: 5,
                            per_page: 50,
                        },
                    },
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes',
                        },
                        'next': {
                            'href': 'https://api.example.com/buzzes?page=5&per_page=50',
                        },
                    },
                    '_embedded': {},
                    'total_count': 5,
                    'page': 2,
                    'per_page': 50,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render absolute link [NTER-1310]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            const profileLink = new HalLink(
                'profile',
                {
                    href: 'https://bit.ly/2XKc1N2?size=100',
                    query: {
                        page: 5,
                    },
                },
            );

            profileLink.relative = false;
            resource.addLink(profileLink);

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'profile': {
                            'href': 'https://bit.ly/2XKc1N2?size=100',
                        },
                    },
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                    'active': null,
                },
            });
        });

        // eslint-disable-next-line max-len
        it('Should render path parameters which allow numbers [NTER-1296]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': 42,
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(
                new HalLink(
                    'nter:fizz',
                    '/fizzes/:fizz_id',
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    'active': null,
                    'fizz_id': 42,
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render not add api base to link', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            const link = new HalLink(
                'nter:fizz', {
                    'href': 'https://www.google.com/',
                },
            );
            link.relative = false;
            resource.addLink(link);

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://www.google.com/',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render all properties for a link', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(
                new HalLink(
                    'nter:fizz',
                    {
                        'href': '/fizzes/{fizz_id}',
                        'name': 'manchuck',
                        'hrefLang': 'EN-us',
                        'title': 'Master of the universe',
                        'templated': true,
                        'icon': 'https://bit.ly/2XKc1N2',
                        'method': 'GET',
                    },
                ),
            );

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/{fizz_id}',
                            'name': 'manchuck',
                            'hreflang': 'EN-us',
                            'title': 'Master of the universe',
                            'templated': true,
                            'icon': 'https://bit.ly/2XKc1N2',
                            'method': 'GET',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should rrror when resource missing url param', () => {
            const resource = new HalResource(
                'fizz',
                {'FID': '42', 'fizzName': 'manchuck'},
            );

            resource.addEmbed(new HalResource(
                'buzz',
                {},
            ));

            expect(render.bind(expect, resource)).to.throw(
                'Resource is missing required property'
            );
        });

        it('Should render relative link [NN-70]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            resource.addLink(new HalLink('nter:fizz', '/fizzes/:fizz_id'));

            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'nter:fizz': {
                            'href': 'https://api.example.com/fizzes/42',
                        },
                    },
                    'active': null,
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                },
            });
        });

        it('Should render absolute link [NN-70]', () => {
            const resource = new HalResource(
                'buzz',
                {
                    'FID': '42',
                    'BID': '84',
                    'buzzLabel': 'manchuck',
                },
            );

            const profileLink = new HalLink(
                'profile',
                {
                    href: 'https://bit.ly/18gECvy',
                },
            );
            profileLink.relative = false;
            resource.addLink(profileLink);


            expect(render(resource)).deep.eq({
                type: 'application/hal+json',
                body: {
                    '_links': {
                        'self': {
                            'href': 'https://api.example.com/buzzes/84',
                        },
                        'profile': {
                            'href': 'https://bit.ly/18gECvy',
                        },
                    },
                    'fizz_id': '42',
                    'buzz_id': '84',
                    'label': 'manchuck',
                    'active': null,
                },
            });
        });
    });

    it('Should throw error when invalid options passed', (done) => {
        // eslint-disable-next-line new-cap
        try {
            // eslint-disable-next-line new-cap
            require('../src/halRenderer').halRender({});
        } catch (Error) {
            expect(Error.toString()).to.eq(
                'Error: Invalid hal configuration',
            );
            return done();
        }

        done(new Error('Rendered did not throw exception'));
    });
});
