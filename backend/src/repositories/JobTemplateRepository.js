import BaseRepository from './BaseRepository.js';
import JobTemplate from '../models/JobTemplate.js';

class JobTemplateRepository extends BaseRepository {
  constructor() {
    super(JobTemplate);
  }
}

export default JobTemplateRepository;
