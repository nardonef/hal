/**
 * @fileOverview Test for the HalEntity
 */

const {expect} = require('chai');
const {HalLink} = require('../src');

describe('HAL Link', () => {
    it('Should take href as string', () => {
        const link = new HalLink('self', 'http://nterprise.com');

        expect(link.rel).to.eq('self');
        expect(link.href).to.eq('http://nterprise.com');
        expect(link.name).to.be.null;
        expect(link.hrefLang).to.be.null;
        expect(link.title).to.be.null;
        expect(link.isTemplated).to.be.false;
        expect(link.icon).to.be.null;
        expect(link.method).to.be.null;
        expect(link.isRelative).to.be.false;

        expect(link.toObject()).to.deep.eq({
            'rel': 'self',
            'href': 'http://nterprise.com',
            'name': null,
            'hreflang': null,
            'title': null,
            'templated': false,
            'icon': null,
            'query': {},
            'method': null,
            'relative': false,
        });
    });

    it('Should take href as object', () => {
        const link = new HalLink(
            'self',
            {href: 'http://nterprise.com'},
        );

        expect(link.rel).to.eq('self');
        expect(link.href).to.eq('http://nterprise.com');
        expect(link.name).to.be.null;
        expect(link.hrefLang).to.be.null;
        expect(link.title).to.be.null;
        expect(link.isTemplated).to.be.false;
        expect(link.icon).to.be.null;
        expect(link.query).deep.eq({});
        expect(link.method).to.be.null;
        expect(link.isRelative).to.be.false;

        expect(link.toObject()).to.deep.eq({
            'rel': 'self',
            'href': 'http://nterprise.com',
            'name': null,
            'hreflang': null,
            'title': null,
            'templated': false,
            'icon': null,
            'query': {},
            'method': null,
            'relative': false,
        });
    });

    it('Should take properties', () => {
        const link = new HalLink(
            'self',
            {
                href: 'http://nterprise.com',
                rel: 'not self',
                name: 'manchuck',
                hrefLang: 'EN-us',
                title: 'Master of the universe',
                templated: true,
                icon: 'https://bit.ly/2XKc1N2',
                query: {'foo': 'bar'},
                method: 'GET',
                relative: false,
            },
        );

        expect(link.rel).to.eq('self');
        expect(link.href).to.eq('http://nterprise.com');
        expect(link.name).to.eq('manchuck');
        expect(link.hrefLang).to.eq('EN-us');
        expect(link.title).to.eq('Master of the universe');
        expect(link.isTemplated).to.be.true;
        expect(link.icon).to.eq('https://bit.ly/2XKc1N2');
        expect(link.query).deep.eq({'foo': 'bar'});
        expect(link.method).to.eq('GET');

        // You have to set the relative directly to make sure you know what
        // you're doing
        expect(link.isRelative).to.be.false;
        link.relative = true;
        expect(link.isRelative).to.be.true;

        expect(link.toObject()).to.deep.eq({
            'rel': 'self',
            'href': 'http://nterprise.com',
            'name': 'manchuck',
            'hreflang': 'EN-us',
            'title': 'Master of the universe',
            'templated': true,
            'icon': 'https://bit.ly/2XKc1N2',
            'query': {'foo': 'bar'},
            'method': 'GET',
            'relative': true,
        });
    });

    it('Should not take defined properties', () => {
        const link = new HalLink(
            'self',
            {
                href: 'http://nterprise.com',
                rel: 'not self',
                name: 'manchuck',
                hrefLang: 'EN-us',
                title: 'Master of the universe',
                templated: true,
                icon: 'https://bit.ly/2XKc1N2',
                method: 'GET',
                query: {'foo': 'bar'},
                fizz: 'buzz',
            },
        );

        expect(link.rel).to.eq('self');
        expect(link.href).to.eq('http://nterprise.com');
        expect(link.name).to.eq('manchuck');
        expect(link.hrefLang).to.eq('EN-us');
        expect(link.title).to.eq('Master of the universe');
        expect(link.isTemplated).to.be.true;
        expect(link.icon).to.eq('https://bit.ly/2XKc1N2');
        expect(link.method).to.eq('GET');
        expect(link.query).deep.eq({'foo': 'bar'});

        expect(link.toObject()).to.deep.eq({
            'rel': 'self',
            'href': 'http://nterprise.com',
            'name': 'manchuck',
            'hreflang': 'EN-us',
            'title': 'Master of the universe',
            'templated': true,
            'icon': 'https://bit.ly/2XKc1N2',
            'query': {'foo': 'bar'},
            'method': 'GET',
            'relative': false,
        });
    });

    it('Should set relative to false [NN-70]', () => {
        const link = new HalLink(
            'self',
            {
                href: '/test',
                rel: 'not self',
                name: 'manchuck',
                hrefLang: 'EN-us',
                title: 'Master of the universe',
                templated: true,
                icon: 'https://bit.ly/2XKc1N2',
                method: 'GET',
                query: {'foo': 'bar'},
                fizz: 'buzz',
            },
        );

        expect(link.rel).to.eq('self');
        expect(link.href).to.eq('/test');
        expect(link.name).to.eq('manchuck');
        expect(link.hrefLang).to.eq('EN-us');
        expect(link.title).to.eq('Master of the universe');
        expect(link.isTemplated).to.be.true;
        expect(link.icon).to.eq('https://bit.ly/2XKc1N2');
        expect(link.method).to.eq('GET');
        expect(link.query).deep.eq({'foo': 'bar'});

        expect(link.toObject()).to.deep.eq({
            'rel': 'self',
            'href': '/test',
            'name': 'manchuck',
            'hreflang': 'EN-us',
            'title': 'Master of the universe',
            'templated': true,
            'icon': 'https://bit.ly/2XKc1N2',
            'query': {'foo': 'bar'},
            'method': 'GET',
            'relative': true,
        });
    });

    it('Should throw exception when rel not truthy', (done) => {
        try {
            new HalLink('', '');
        } catch (error) {
            expect(error.toString()).
                to.
                eq(`Error: "rel" is required for HalLink`);
            done();
            return;
        }

        done('HalLink did not throw exception for empty string');
    });

    it('Should throw exception when rel href not present', (done) => {
        try {
            new HalLink('self', {foo: 'bar'});
        } catch (error) {
            expect(error.toString()).
                to.
                eq(`Error: Missing href for HalLink`);
            done();
            return;
        }

        done('HalLink did not throw exception for empty string');
    });
});
