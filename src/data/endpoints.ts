/** MasteryConnect REST API v2 paths the reports cite, spelled as the OpenAPI spec spells them. */
export const ENDPOINTS = {
  classrooms: 'GET /api/v2/classrooms',
  classroomObjectives: 'GET /api/v2/classrooms/{classroom_id}/objectives',
  schools: 'GET /api/v2/districts/{district_id}/schools',
  teacher: 'GET /api/v2/teachers/{id}',
  materials: 'GET /api/v2/materials',
  materialItems: 'GET /api/v2/materials/{material_id}/items',
  itemAnalysis: 'GET /api/v2/reports/item_analysis?filter[classroom_id]={id}',
  curriculumMaps: 'GET /api/v2/curriculum_maps',
  curriculumMapObjectives: 'GET /api/v2/curriculum_maps/{curriculum_map_id}/objectives',
} as const
