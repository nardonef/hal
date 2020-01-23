/**
 * @fileOverview HAL Renderer
 */
const createError = require('http-errors');
const {HalLink} = require('./halLink');
const _ = require('lodash');
const restUrlBuilder = require('rest-url-builder');
const Validator = require('jsonschema').Validator;
const jsonValidator = new Validator();
const {URL, URLSearchParams} = require('url');

/**
 * @typedef {Object} HalResponse
 * @property {Object} _embedded
 * @property {Object} _links
 */

/**
 * @typedef {Object} EntityDefinition
 * @property {String} entity_type Entity as it appears alone
 * @property {String} collection_type Entity as it appears in a collection
 * @property {String} version Entity version
 * @property {String} entity_path Path to get the entity
 * @property {String} collection_path Path to get the entity as a collection
 * @property {Array<String>} collection_query allowed URL Parameters
 * @property {Object} collection_map Key/Value pair of allowed collection
 *  properties
 * @property {Object} entity_map Key/Value pair of allowed entity properties
 */

/**
 * @typedef {Object} HalOptions
 * @property {String} api_base Base path to the API
 * @property {Boolean} build_link_header Tells the renderer to include link
 *  headers
 * @property {Object<EntityDefinition>[]} entity_definitions collection of
 *  definitions
 */

/**
 * Pulls the entity definition from the config
 * @param {String} entity Which entity to retrieve
 * @param {Object<HalOptions>} options the options for all entities
 * @return {Object<EntityDefinition>}
 */
const getDefinitionForEntity = _.memoize((entity, options) => {
    const definition = _.find(
        _.get(options, 'entity_definitions'),
        (definition) => {
            return _.get(definition, 'entity_type') === entity;
        },
    );

    if (definition === undefined) {
        throw new createError.UnsupportedMediaType(
            `Invalid resource type: ${entity}`,
        );
    }

    return definition;
});

/**
 * @callback render
 *
 * @param {Object<HalResource>}
 * @return {{type: string, body: Object<HalResponse>}}
 */

/**
 * Renders hal responses
 *
 * @param {Object<HalOptions>} options configuration for resources
 * @return {Function<render>}
 */
module.exports.halRender = (options) => {
    const validOptions = jsonValidator.validate(
        options,
        require('./halSchema.json'),
    );

    if (!validOptions.valid) {
        throw new Error(
            'Invalid hal configuration',
        );
    }

    /**
     * Builds the content type for a resource
     * @param {Object<HalResource>} resource
     * @return {string}
     */
    const buildType = (resource) => 'application/hal+json';

    /**
     * Adds the self link to the resource based on the value from the
     * entity definition
     *
     * @param {Object<HalResource>} resource
     */
    const addSelfLink = (resource) => {
        const definition = getDefinitionForEntity(resource.type, options);
        if (!resource.hasLinkRel('self')) {
            resource.addLink(
                new HalLink(
                    'self',
                    _.get(definition,
                        resource.isCollection()
                            ? 'collection_path'
                            :'entity_path'
                    )
                ),
            );
        }
    };

    /**
     * Builds the HREF for a link
     *
     * @param {Object<HalLink>} link
     * @param {Object<HalResource>} resource
     * @return {String}
     */
    const buildLinkHref = (link, resource) => {
        if (!link.isRelative) {
            return link.href;
        }

        const absoluteUrl = `${_.get(options, 'api_base')}${link.href}`;
        if (link.isTemplated) {
            return absoluteUrl;
        }

        const url = new URL(absoluteUrl);

        // Use both extracted data and set data
        const extracted = _.merge(
            resource.data,
            extractResourceData(resource),
        );

        const urlBuilder = new restUrlBuilder.RestURLBuilder();
        const builder = urlBuilder.buildRestURL(url.pathname);
        _.forEach(extracted, (value, key) => {
            if (!_.has(builder.getNamedParameters(), `:${key}`)) {
                return;
            }

            // Fixes https://nterprise.atlassian.net/browse/NTER-1296
            if (value === null || _.isEmpty('' + value)) {
                throw new Error(`Resource is missing required property`);
            }

            builder.setNamedParameter(key, '' + value);
        });

        url.pathname = builder.get();
        url.search = buildLinkQuery(link);
        return url.toString();
    };

    const buildLinkQuery = (link) => {
        // extract query from href
        const queryString = _.split(link.href, '?', 2)[1];
        const linkSearch = new URLSearchParams(queryString);
        const linkQuery = link.query;
        // merge with the query property from links
        _.forEach([...linkSearch.entries()], (params) => {
            const key = params[0];
            const value = params[1];

            if (!_.has(linkQuery, key)) {
                _.set(linkQuery, key, value);
            }
        });

        const query = _.flatten(_.map(linkQuery, (value, key) => {
            if (_.isObject(value)) {
                return _.map(value, (objValue, objKey) => {
                    return `${key}[${objKey}]=${objValue}`;
                });
            }

            return `${key}=${value}`;
        })).join('&');

        return new URLSearchParams(query);
    };

    /**
     * Extracts data from a HalResource
     *
     * This runs through the definition and maps the data
     *
     * @param {Object<HalResource>} resource
     * @return {Object}
     */
    const extractResourceData = (resource) => {
        const definition = getDefinitionForEntity(resource.type, options);
        const defaults = {};

        const defRoot = resource.isCollection()
            ? 'collection_map'
            : 'entity_map';

        const entityMap = _.get(definition, defRoot);

        _.forEach(entityMap, (key) => {
            _.set(defaults, key, null);
        });

        const mapped = _.mapKeys(resource.data, _.partial(
            (entityMap, value, key) =>
                _.get(entityMap, key, key),
            entityMap,
        ));

        const merged = _.merge(
            defaults,
            mapped,
        );

        return _.pickBy(merged, (value, key) => {
            return _.includes(_.get(definition, defRoot), key);
        });
    };

    /**
     * Renders the resource with the _links properties
     *
     * @param {Object<HalResource>} resource
     * @return {Object<HalResponse>}
     */
    const renderResource = (resource) => {
        addSelfLink(resource);

        const response = extractResourceData(resource);

        _.set(response, '_links', renderLinks(resource));
        return response;
    };

    /**
     * Renders the HAL Links for a resource
     *
     * @param {Object<HalResource>} resource
     * @return {Object[]}
     */
    const renderLinks = (resource) => {
        const links = {};
        _.forEach(resource.links, (link) => {
            const rendered = _.pickBy(
                link.toObject(),
                (value, key) =>
                    !_.includes(
                        ['rel', 'templated', 'query', 'relative'],
                        key,
                    )
                    && value !== null,
            );

            if (link.isTemplated) {
                _.set(rendered, 'templated', true);
            }

            _.set(rendered, 'href', buildLinkHref(link, resource));
            _.set(
                links,
                link.rel,
                rendered,
            );
        });

        return links;
    };

    /**
     * Renders all embedded objects for the object
     *
     * @param {Object<HalResource>} resource
     * @return {Object}
     */
    const renderEmbed = (resource) => {
        const embed = {};

        const resourceEmbed = _.flatten(
            _.map(resource.embeds, (value) => value),
        );

        _.forEach(resourceEmbed, (childResource) => {
            const rendered = renderResource(childResource);
            const embedKey = _.get(
                getDefinitionForEntity(childResource.type, options),
                'collection_type',
            );

            if (!_.has(embed, embedKey)) {
                _.set(embed, embedKey, []);
            }

            _.get(embed, embedKey).push(rendered);
        });

        return embed;
    };

    /**
     * Renders a hal resource through express
     * @param {Object<HalResource>} resource
     * @return {Object<HalResponse>}
     */
    return (resource) => {
        const response = renderResource(resource);

        if (resource.isCollection() || resource.hasEmbedded()) {
            _.set(response, '_embedded', renderEmbed(resource));
        }

        return {
            type: buildType(resource),
            body: response,
        };
    };
};

module.exports.getDefinitionForEntity = getDefinitionForEntity;
