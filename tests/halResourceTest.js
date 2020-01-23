/**
 * @fileOverview Test for the HalResource
 */
const {expect} = require('chai');
const {HalLink, HalResource, HAL_MAX_EMBED_LIMIT} = require('../src');

describe('HAL Resource', () => {
    context('Properties', () => {
        it('Set the required properties', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.type).to.eq('foo');
            expect(resource.data).deep.eq({'fizz': 'buzz', 'baz': 'bat'});
            expect(resource.isCollection()).to.be.false;

            expect(resource.hasEmbedded()).to.be.false;
            expect(resource.hasLinks()).to.be.false;

            expect(resource.hasEmbeddedType('fizz')).to.be.false;
            expect(resource.hasLinkRel('self')).to.be.false;
        });
    });

    context('Embeds', () => {
        it('Should allow resources to be enbedded', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.hasEmbedded()).to.be.false;
            const embeddedFizz = new HalResource(
                'fizz',
                {'fizz_id': 1},
            );

            const embeddedBuzz = new HalResource(
                'buzz',
                {'buzz_id': 1},
            );

            resource.addEmbed(embeddedFizz);
            expect(resource.hasEmbedded()).to.be.true;
            expect(resource.hasEmbeddedType('fizz')).to.be.true;
            expect(resource.hasEmbeddedType('buzz')).to.be.false;
            expect(resource.hasEmbeddedType('foo')).to.be.false;

            resource.addEmbed(embeddedBuzz);
            expect(resource.hasEmbedded()).to.be.true;
            expect(resource.hasEmbeddedType('fizz')).to.be.true;
            expect(resource.hasEmbeddedType('buzz')).to.be.true;
            expect(resource.hasEmbeddedType('foo')).to.be.false;

            expect(resource.embeds).deep.eq({
                'fizz': [embeddedFizz],
                'buzz': [embeddedBuzz],
            });
        });

        it('Should throw exception when trying to embed a non resource', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(
                resource.addEmbed.bind(resource, {})).
                to.
                throw('Only resources can be embedded');
        });

        it('Should throw exception when trying to embed collections', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            const collection = new HalResource(
                'collection',
                {},
                true,
            );

            expect(resource.addEmbed.bind(resource, collection)).
                to.
                throw('Collections cannot be embedded');
        });

        it('Should throw exception when trying to embed too many collections',
            () => {
                const resource = new HalResource(
                    'foo',
                    {'fizz': 'buzz', 'baz': 'bat'},
                );

                for (let count = 1; count <= HAL_MAX_EMBED_LIMIT; count++) {
                    resource.addEmbed(new HalResource(
                        'fizz',
                        {'fizz_id': count},
                    ));
                }

                expect(resource.embeds.fizz.length).to.eq(HAL_MAX_EMBED_LIMIT);

                const lastCollection = new HalResource(
                    'fizz',
                    {'fizz_id': 101},
                );

                expect(resource.addEmbed.bind(resource, lastCollection)).
                    to.
                    throw('Embedded resources cannot exceed 100');
            });
    });

    context('Links', () => {
        it('Should add Links', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.hasLinks()).to.be.false;

            const link = new HalLink('self', 'fizz/:buzz');

            resource.addLink(link);
            expect(resource.hasLinks()).to.be.true;
            expect(resource.hasLinkRel('self')).to.be.true;
            expect(resource.links).deep.eq({self: link});
        });

        it('Should not overwrite link', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.hasLinks()).to.be.false;

            const link = new HalLink('self', 'fizz/:buzz');

            resource.addLink(link);
            expect(resource.hasLinks()).to.be.true;
            expect(resource.hasLinkRel('self')).to.be.true;
            expect(resource.links).deep.eq({self: link});
            expect(resource.getLinkRel('self')).deep.eq(link);

            expect(resource.addLink.bind(resource, link)).
                to.
                throw('Cannot add [self] link: already set');
        });

        it('Should error when trying to get link that is not set', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.hasLinks()).to.be.false;

            expect(resource.getLinkRel.bind(resource, 'self')).
                to.
                throw('Resource does not contain the [self] link');
        });

        it('Should allow Links to be overwritten', () => {
            const resource = new HalResource(
                'foo',
                {'fizz': 'buzz', 'baz': 'bat'},
            );

            expect(resource.hasLinks()).to.be.false;

            const link = new HalLink('self', 'fizz/:buzz');

            resource.addLink(link);
            expect(resource.hasLinks()).to.be.true;
            expect(resource.hasLinkRel('self')).to.be.true;

            const replace = new HalLink('self', 'foo/:bar');
            resource.addLink(replace, true);

            expect(resource.hasLinks()).to.be.true;
            expect(resource.hasLinkRel('self')).to.be.true;
            expect(resource.links).deep.eq({self: replace});
        });
    });
});
