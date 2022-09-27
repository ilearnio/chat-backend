import knx from 'knex';
import config from '../../knexfile'

const environment = process.env.ENV || 'development';
const knex = knx(config[environment]);

export default knex;
