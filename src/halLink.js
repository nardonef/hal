/**
 * @fileOverview The HalLink class
 */
const _ = require('lodash');
const {Boolify: boolify} = require('node-boolify');
const assert = require('assert');

/**
 * @typedef {Object} HalProperties
 * @param {String} rel
 * @param {String} href
 * @param {String} name
 * @param {String} hreflang
 * @param {String} title
 * @param {boolean} templated
 * @param {String} icon
 * @param {String} method
 * @param {Object<String>} query
 */

/**
 * A HAL Link
 */
class HalLink {
    /**
     * @param {String} rel
     * @param {String|Object} value
     */
    constructor(rel, value) {
        if (!rel) {
            throw new Error(`"rel" is required for HalLink`);
        }

        this._rel = rel;
        this._href = null;
        this._name = null;
        this._hreflang = null;
        this._title = null;
        this._templated = false;
        this._icon = null;
        this._method = null;

        this._query = {};

        if (!_.isObject(value)) {
            this._href = value;
            this._relative = value.indexOf('http') !== 0;
            return;
        }

        if (!_.has(value, 'href')) {
            throw new Error('Missing href for HalLink');
        }

        this._relative = value.href.indexOf('http') !== 0;

        this._href = _.get(value, 'href');

        // Only allow valid link properties
        const validProps = _.pick(
            value,
            [
                'name',
                'hrefLang',
                'title',
                'templated',
                'icon',
                'query',
                'method',
            ],
        );
        _.forEach(validProps, (value, key) => {
            this[key] = value;
        });
    }

    /**
     * Retuns the link relation
     * @return {String}
     */
    get rel() {
        return this._rel;
    }

    /**
     * Returns the href
     * @return {null|String}
     */
    get href() {
        return this._href;
    }

    /**
     * Returns the name
     * @return {null|String}
     */
    get name() {
        return this._name;
    }

    /**
     * Gets the query params for the link
     *
     * @return {Object}
     */
    get query() {
        return this._query;
    }

    /**
     * Sets the query parameters for the url
     * @param {Object} query
     */
    set query(query) {
        assert(_.isObjectLike(query));
        this._query = query;
    }

    /**
     * Sets the name
     * @param {String} value
     */
    set name(value) {
        this._name = value;
    }

    /**
     * Returns the href language
     * @return {null|String}
     */
    get hrefLang() {
        return this._hreflang;
    }

    /**
     * Sets the href Language
     * @param {String} value
     */
    set hrefLang(value) {
        this._hreflang = value;
    }

    /**
     * Returns the link title
     * @return {null|String}
     */
    get title() {
        return this._title;
    }

    /**
     * Sets the link title
     * @param {String} value
     */
    set title(value) {
        this._title = value;
    }

    /**
     * Tests if the link is a templated link or not
     * @return {boolean}
     */
    get isTemplated() {
        return this._templated;
    }

    /**
     * Toggles the templated flag
     * @param {Boolean} value
     */
    set templated(value) {
        this._templated = boolify(value);
    }

    /**
     * Returns the link Icon
     * @return {null|String}
     */
    get icon() {
        return this._icon;
    }

    /**
     * Sets the link icon
     * @param {String} value
     */
    set icon(value) {
        this._icon = value;
    }

    /**
     * Returns the method to access the link
     * @return {null|String}
     */
    get method() {
        return this._method;
    }

    /**
     * Sets the link method
     * @param {String} value
     */
    set method(value) {
        this._method = value;
    }

    /**
     * Toggles the relative flag
     *
     * @param {Boolean} value
     */
    set relative(value) {
        this._relative = boolify(value);
    }

    /**
     * Check if the link is relative or absolute
     * @return {boolean}
     */
    get isRelative() {
        return this._relative;
    }

    /**
     * Returns the link as an object
     *
     * Useful for serialization
     *
     * @return {Object<HalProperties>}
     */
    toObject() {
        return {
            'rel': this.rel,
            'href': this.href,
            'name': this.name,
            'hreflang': this.hrefLang,
            'title': this.title,
            'templated': this.isTemplated,
            'icon': this.icon,
            'query': this.query,
            'method': this.method,
            'relative': this.isRelative,
        };
    }
}

module.exports.HalLink = HalLink;
