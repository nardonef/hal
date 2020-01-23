/**
 * @fileOverview Functions to convert entities to HAL resources
 */
const _ = require('lodash');
const assert = require('assert');
const {Entity} = require('@nterprise/api-sdk').entities;
const {HalResource} = require('./halResource');
const {HalLink} = require('./halLink');
const httpErrors = require('http-errors');

module.exports = (config) => {
    /**
     * Returns the relation for the entity
     *
     * Based off the entity name
     *
     * @param {Entity} entity
     * @return {{hal, links}}
     */
    const getHalForEntity = (entity) => {
        const entityName = entity.prototype
            ? entity.name
            : entity.constructor.name;
        const halRelation = _.get(
            config,
            `entityConfig.${entityName}.hal`,
            null,
        );

        if (!halRelation) {
            throw new httpErrors.InternalServerError(
                'Invalid HAL configured for entity',
            );
        }

        return halRelation;
    };
    /**
     * Converts a collection of customers into Hal Resources
     *
     * @param {Class<Entity>} EntityPrototype
     * @param {IterableIterator<Entity|{offset, totalCount, limit}>} iterator
     *          Customer iterator
     * @param {String} self the limit used for iteration
     *          (needed for hal rendering)
     * @return {HalResource}
     */
    const entitiesToCollection = (EntityPrototype, iterator, self) => {
        const body = {
            'total_count': 0,
            'offset': null,
            'limit': 1,
        };

        const hal = getHalForEntity(EntityPrototype);

        const entityCollection = new HalResource(
            hal.rel,
            body,
            true,
        );

        let result = iterator.next();
        while (!result.done) {
            entityCollection.addEmbed(entityToResource(result.value));
            result = iterator.next();
        }

        entityCollection.data.total_count = result.value.totalCount;
        if (result.value.offset) {
            entityCollection.data.offset = result.value.offset;

            entityCollection.addLink(new HalLink(
                'next',
                {
                    href: self,
                    query: {
                        'limit': result.value.pageCount,
                        'offset': result.value.offset,
                    },
                },
            ));
        }

        entityCollection.data.total_count = result.value.totalCount;
        entityCollection.data.limit = result.value.pageCount;
        return entityCollection;
    };

    /**
     * Converts a customer to a Hal Resource
     *
     * @param {Entity} entity entity to convert
     * @return {HalResource}
     */
    const entityToResource = (entity) => {
        assert(
            entity instanceof Entity,
            'Only entities can be converted to resources',
        );

        const hal = getHalForEntity(entity);

        //
        // TODO (NN-520)
        //  Update HalResource to embed the first five attached entities of
        //  each type
        //
        const entityData = entity.toObject();
        const entityResource = new HalResource(
            hal.rel,
            entityData,
        );

        _.map(hal.links, (value) => {
            entityResource.addLink(new HalLink(...value));
        });

        _.forEach(entity.assignedTo, (assignedToStr) => {
            const type = _.get(_.split(assignedToStr, ':'), 0);
            const id = _.get(_.split(assignedToStr, ':'), 1);
            const entityConfig = _.pickBy(
                _.get(config, 'entityConfig'),
                (val) => _.get(val, 'type') === type
            );
            const entityName = _.head(_.keys(entityConfig));
            const halRel = _.get(entityConfig, `${entityName}.hal.rel`);

            const pathConfig = _.pickBy(
                _.get(config, 'pathMap'),
                (val) => _.get(val, 'entity') === entityName
            );
            const entityPath = _.head(_.keys(pathConfig));

            try {
                entityResource.addLink(new HalLink(
                    halRel,
                    {href: `${entityPath}/${id}`}
                ));
            } catch (error) {
                //
                // FIXME (NN-521)
                //  HalLink only adds one link per halRef
                //  Fix to allow adding multiple links for a ref type
                //
                // istanbul ignore next
                // eslint-disable-next-line max-len
                if (!error.message.match(/Cannot add \[.*] link: already set$/)) {
                    throw error;
                }
            }
        });

        return entityResource;
    };

    return {
        entitiesToCollection: entitiesToCollection,
        entityToResource: entityToResource,
    };
};
