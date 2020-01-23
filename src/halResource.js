/**
 * @fileOverview A HalEntity class
 */
const _ = require('lodash');
const {Boolify: boolify} = require('node-boolify');
const assert = require('assert');
const {HalLink} = require('./halLink');

const HAL_MAX_EMBED_LIMIT = 100;

/**
 * A HalResource Entity
 */
class HalResource {
    /**
     * @param {String} name The name of the resource
     * @param {Object} data Non-embedded data for the resource
     * @param {Boolean} collection marks this as a collection of resources
     */
    constructor(name, data, collection = false) {
        this._data = _.omit(data, ['_links', '_embed']);
        this._type = name;
        this._collection = boolify(collection);

        this._embeds = {};
        this._links = {};
    }

    /**
     * Returns the entity type
     * @return {String}
     */
    get type() {
        return this._type;
    }

    /**
     * Gets the resource data
     * @return {Object}
     */
    get data() {
        return this._data;
    }

    /**
     * Gets Embedded resources
     * @return {Object<HalResource>[]}
     */
    get embeds() {
        return this._embeds;
    }

    /**
     * Gets the links of the resource
     * @return {{}|*}
     */
    get links() {
        return this._links;
    }

    /**
     * Tests if the resource is a collection or not
     * @return {Boolean}
     */
    isCollection() {
        return this._collection;
    }

    /**
     *
     * @param {Object<HalResource>} resource
     */
    addEmbed(resource) {
        assert(
            resource instanceof HalResource,
            'Only resources can be embedded',
        );

        if (resource.isCollection()) {
            throw new Error(
                'Collections cannot be embedded',
            );
        }

        const resourceType = resource.type;

        if (!_.has(this, `_embeds.${resourceType}`)) {
            _.set(this, `_embeds.${resourceType}`, []);
        }

        // This is hardcoded as we will never go above this limit
        if (_.get(this, `_embeds.${resourceType}`).length
            >= HAL_MAX_EMBED_LIMIT
        ) {
            throw new Error(
                `Embedded resources cannot exceed ${HAL_MAX_EMBED_LIMIT}`,
            );
        }

        _.get(this, `_embeds.${resourceType}`).push(resource);
    }

    /**
     * Adds a link to the resource
     *
     * @param {Object<HalLink>} link the link to add
     * @param {Boolean} overwrite overwrite existing relation
     */
    addLink(link, overwrite = false) {
        assert(
            link instanceof HalLink,
            'Only HAL Links can be added',
        );

        if (!overwrite && this.hasLinkRel(link.rel)) {
            throw new Error(
                `Cannot add [${link.rel}] link: already set`,
            );
        }

        _.set(this.links, link.rel, link);
    }

    /**
     * Tests if a link rel is already set
     *
     * @param {String} rel
     * @return {boolean}
     */
    hasLinkRel(rel) {
        return _.has(this, `_links.${rel}`);
    }

    /**
     * Gets a link relation
     *
     * @param {String} rel
     * @return {boolean}
     */
    getLinkRel(rel) {
        if (!this.hasLinkRel(rel)) {
            throw new Error(`Resource does not contain the [${rel}] link`);
        }

        return _.get(this, `_links.${rel}`);
    }

    /**
     * Tests if the resource has links
     *
     * @return {boolean}
     */
    hasLinks() {
        return !_.isEmpty(this._links);
    }

    /**
     * Tests if the resource has embedded objects
     *
     * @return {boolean}
     */
    hasEmbedded() {
        return !_.isEmpty(this._embeds);
    }

    /**
     * Tests if the resource has an embedded type
     *
     * @param {String} type
     * @return {boolean}
     */
    hasEmbeddedType(type) {
        return _.has(this, `_embeds.${type}`);
    }
}

module.exports.HalResource = HalResource;
module.exports.HAL_MAX_EMBED_LIMIT = HAL_MAX_EMBED_LIMIT;
