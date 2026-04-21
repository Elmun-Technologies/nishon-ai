import type { SiteTemplateId } from '../types'
import { COURSE_SECTION_BLUEPRINT } from './course'
import { FASHION_SECTION_BLUEPRINT } from './fashion'

export function blueprintFor(templateId: SiteTemplateId) {
  return templateId === 'course' ? COURSE_SECTION_BLUEPRINT : FASHION_SECTION_BLUEPRINT
}
