"""Document-only OpenAPI generator. No server, DB, network or application code."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
S = {}
def ref(n): return {'$ref': '#/components/schemas/' + n}
def typ(t):
    if t.endswith('?'): return {'anyOf': [typ(t[:-1]), {'type': 'null'}]}
    if t.startswith('[]'): return {'type': 'array', 'items': typ(t[2:]), 'maxItems': 100}
    if t.startswith('@'): return ref(t[1:])
    if t.startswith('e:'): return {'type': 'string', 'enum': t[2:].split('|')}
    if t.startswith('s:'): return {'type': 'string', 'maxLength': int(t[2:])}
    return {
        'id': {'type': 'string', 'format': 'uuid'},
        'dt': {'type': 'string', 'format': 'date-time'},
        'int': {'type': 'integer', 'minimum': 0, 'maximum': 2147483647},
        'bool': {'type': 'boolean'}, 'true': {'const': True},
        'sha': {'type': 'string', 'pattern': '^[0-9a-f]{40}$'},
        'digest': {'type': 'string', 'pattern': '^[0-9a-f]{64}$'},
        'gh': {'type': 'string', 'pattern': '^[1-9][0-9]{0,18}$'},
        'bytes': {'type': 'string', 'pattern': '^(0|[1-9][0-9]{0,18})$'},
        'dec': {'type': 'string', 'pattern': r'^(0|[1-9][0-9]{0,9})(\.[0-9]{1,2})?$', 'maxLength': 13},
        'uri': {'type': 'string', 'format': 'uri', 'maxLength': 2000},
        'email': {'type': 'string', 'format': 'email', 'maxLength': 254},
    }[t]
def schema(name, fields, base=False):
    p = {}; required = []
    if base: fields = 'id=id institution_id=id created_at=dt row_version=int ' + fields
    for token in fields.split():
        n, t = token.split('=', 1)
        optional = n.endswith('?'); n = n.rstrip('?')
        p[n] = typ(t)
        if not optional: required.append(n)
    S[name] = {'type': 'object', 'additionalProperties': False, 'properties': p, 'required': required}

DEFS = {
'Error': 'error=@ErrorDetail',
'ErrorDetail': 'code=s:80 message=s:1000 request_id=s:128 retryable=bool field_errors?=[]@FieldError',
'FieldError': 'field=s:100 code=s:80',
'Reason': 'reason=s:2000 expected_version=int',
'Confirm': 'confirm=true reason=s:2000 expected_version=int',
'Me': 'user_id=id github_user_id=gh github_login=s:100 csrf_token=s:256 institutions=[]@MyInstitution',
'MyInstitution': 'id=id name=s:200 role=s:80',
'InstitutionInput': 'name=s:200 default_timezone=s:100',
'MembershipInput': 'user_id=id role=e:admin|member|teacher|ta capabilities=[]s:80',
'MembershipChange': 'role=e:admin|member|teacher|ta capabilities=[]s:80 status=e:active|revoked expected_version=int',
'GrantInput': 'subject_user_id=id purpose=s:1000 capabilities=[]s:80 classroom_ids=[]id expires_at=dt submission_id?=id evaluation_id?=id draft_version?=int',
'OrganizationConnect': 'institution_id=id installation_id=gh expected_github_org_id=gh',
'CapabilityCheck': 'name=s:100 status=e:passed|failed|unverified message=s:1000',
'Capabilities': 'organization_id=id checked_at=dt ready=bool checks=[]@CapabilityCheck',
'ClassroomInput': 'institution_id=id organization_id=id name=s:200 slug=s:100 timezone=s:100 academic_period=s:100',
'ClassroomChange': 'name=s:200 status=e:draft|active|archived expected_version=int',
'Dashboard': 'classroom_id=id students=int assignments=int confirmed_submissions=int needs_review=int preservation_blocked=int stale_integrations=int last_refreshed_at=dt',
'RosterInput': 'academic_identifier=s:100 name=s:200 email?=email?',
'ImportError': 'row=int code=s:80 message=s:500',
'ImportCommit': 'source_digest=digest expected_version=int confirm=true',
'IdentityRequestInput': 'classroom_id=id academic_identifier=s:100',
'IdentityRequestReceipt': 'id=id created_at=dt state=e:pending|approved|rejected message=s:300',
'IdentityDecision': 'decision=e:approve|reject reason=s:2000 expected_version=int approval_context?=s:1000',
'BindingCorrection': 'action=e:revoke|replace successor_request_id=id? reason=s:2000 expected_version=int approval_context=s:1000 confirm=true',
'AssignmentInput': 'slug=s:100',
'VersionInput': 'title=s:200 description=s:20000 maximum=dec deadline=dt? timezone=s:100 branch=s:255 template_repo_id=gh template_sha=sha template_tree_sha=sha workflow_path=s:500 report_schema_version=s:40',
'InvitationInput': 'expires_at=dt? expected_version=int',
'InvitationCreated': 'invitation=@Invitation acceptance_url=uri',
'InvitationPreview': 'assignment_id=id classroom_id=id title=s:200 institution_name=s:200 requires_login=true',
'AcceptanceInput': 'invitation_token=s:256 expected_assignment_version_id=id',
'ExtensionInput': 'new_deadline=dt reason=s:2000 expected_version=int',
'SubmissionPreview': 'observation_id=id acceptance_id=id sha=sha branch=s:255 observed_at=dt expires_at=dt effective_deadline=dt? assignment_version_id=id policy_version=s:80',
'SubmissionInput': 'sha=sha branch=s:255 observation_id?=id?',
'SubmissionReceipt': 'extension_id=id? request_sequence=int timestamp_provenance=@TimestampProvenance persistence_recorded_at=dt deadline_status=e:known|no_deadline|uncertain policy_resolution_state=e:resolved|needs_review candidate_policy_versions=[]s:80 request_id=id acceptance_id=id actor_id=id sha=sha received_at=dt effective_deadline=dt? assignment_version_id=id policy_version=s:80 validation_state=e:received|validating|confirmed|needs_review|rejected academic_classification=e:unresolved|on_time|late|exempt|not_applicable submission_id=id?',
'ResolutionInput': 'classification=e:unresolved|on_time|late|exempt|not_applicable reason=s:2000 evidence_reference?=s:1000 expected_version=int confirm=true',
'IncidentInput': 'student_profile_id=id assignment_id=id description=s:3000',
'TestResult': 'test_key=s:200 outcome=e:passed|failed|skipped|error score=dec? maximum=dec? duration_ms=int?',
'EvaluationInput': 'scale_version_id=id',
'EvidenceInput': 'run_id=id expected_version=int',
'DraftInput': 'score=dec? feedback=s:20000? internal_notes=s:20000? expected_version=int',
'PublicationInput': 'expected_draft_version=int expected_grade_generation=int expected_publication_id=id? confirm=true deleted_evidence_exception?=@DeletedEvidenceExceptionInput',
'WithdrawalInput': 'expected_grade_generation=int student_reason=s:2000 internal_notes?=s:20000? confirm=true',
'CurrentGrade': 'acceptance_id=id state=e:never_published|published|withdrawn generation=int publication=@Publication? latest_submission_revision=int? evaluated_revision=int? newer_submission_exists=bool latest_request=@RequestSummary?',
'GradeHistoryEvent': 'id=id kind=e:publication|withdrawal occurred_at=dt publication=@Publication? withdrawal=@Withdrawal?',
'StaffGradeHistoryEvent': 'event=@GradeHistoryEvent internal_notes=s:20000?',
'SnapshotManifest': 'scope=s:1000 completeness=e:not_inspected|complete_for_declared_scope|partial lfs=s:500 submodules=s:500 external_resources=s:500 expanded_bytes=bytes? entry_count=int? exclusions=[]s:500',
'HoldInput': 'reason=s:2000 responsible_user_id=id review_at=dt expected_version=int',
'QuotaInput': 'compressed_limit_bytes=bytes expanded_limit_bytes=bytes entries_limit=int course_limit_bytes=bytes institution_limit_bytes=bytes warning_percentages=[]int expected_version=int reason=s:2000',
'StorageUsage': 'institution_id=id classroom_id=id? used_bytes=bytes reserved_bytes=bytes quota_bytes=bytes blocked_count=int failed_count=int captured_at=dt',
'CapacityForecast': 'classroom_id=id estimated_bytes=bytes available_bytes=bytes confidence=e:insufficient_data|estimate warning=bool assumptions=[]s:500',
'RetentionChange': 'close_months=int pending_days=int expected_version=int reason=s:2000',
'RetentionMigrationInput': 'policy_id=id classroom_ids=[]id reason=s:2000 confirm=true expected_version=int',
'AuditEvent': 'id=id occurred_at=dt action=s:100 resource_type=s:100 resource_id=id actor_id=id? summary=s:1000',
'Health': 'status=e:ok|degraded component=s:100',
'WebhookAcknowledgement': 'received=true',
}
for n, f in DEFS.items(): schema(n, f)
RESOURCES = {
'Institution': 'name=s:200 status=e:active|suspended|archived default_timezone=s:100',
'Membership': 'user_id=id role=e:admin|member|teacher|ta capabilities=[]s:80 status=e:active|revoked',
'AuthorizationGrant': 'submission_id=id? evaluation_id=id? draft_version=int? consumed_publication_id=id? subject_user_id=id issuer_user_id=id purpose=s:1000 capabilities=[]s:80 classroom_ids=[]id expires_at=dt revoked_at=dt?',
'Organization': 'github_org_id=gh login=s:100 installation_id=gh status=e:pending|active|suspended|revoked selection=e:all|selected last_checked_at=dt?',
'Classroom': 'retention_generation=int retention_recalculation_pending=bool prior_deletion_claims_exist=bool organization_id=id name=s:200 slug=s:100 timezone=s:100 academic_period=s:100 status=e:draft|active|archived academic_closed_at=dt?',
'RosterEntry': 'classroom_id=id student_profile_id=id academic_identifier=s:100 name=s:200 email=email? status=e:active|withdrawn link_state=e:unlinked|pending|active|revoked',
'ImportPreview': 'classroom_id=id state=e:pending|validating|preview_ready|applied|failed source_digest=digest valid_rows=int invalid_rows=int errors=[]@ImportError',
'IdentityRequestStaff': 'current_binding_id=id? current_binding_version=int? approval_context=s:1000 requires_broader_authority=bool classroom_id=id profile_id=id? requester_user_id=id github_account_id=id state=e:pending|approved|rejected decided_at=dt?',
'IdentityBinding': 'profile_id=id user_id=id github_account_id=id status=e:active|revoked|replaced verification_method=s:80 predecessor_id=id?',
'Assignment': 'classroom_id=id slug=s:100 status=e:draft|active|closed|archived current_version_id=id?',
'AssignmentVersion': 'assignment_id=id version=int title=s:200 description=s:20000 maximum=dec deadline=dt? timezone=s:100 branch=s:255 template_repo_id=gh template_sha=sha template_tree_sha=sha workflow_path=s:500 report_schema_version=s:40 published_at=dt?',
'Invitation': 'assignment_id=id expires_at=dt? disabled=bool',
'AcceptedAssignment': 'external_cleanup=@ExternalCleanup assignment_id=id roster_entry_id=id accepted_at=dt repository_id=id? provisioning_state=s:60 access_state=s:60',
'Repository': 'academic_access_allowed=bool external_cleanup=@ExternalCleanup acceptance_id=id github_repository_id=gh? url=uri? provisioning_state=e:pending|creating|outcome_unknown|repository_created|configuring|ready|retryable_failure|needs_operator access_state=e:not_requested|invitation_pending|granted|revocation_pending|revoked|blocked sync_state=e:fresh|stale|inaccessible|installation_suspended',
'Extension': 'acceptance_id=id new_deadline=dt reason=s:2000 policy_version=int',
'Submission': 'request_id=id acceptance_id=id revision=int sha=sha confirmed_at=dt assignment_version_id=id',
'AcademicResolution': 'decision=e:reject|confirm_exception|reclassify|resolve_incident resulting_request_version=int? request_id=id? incident_id=id? actor_id=id classification=e:unresolved|on_time|late|exempt|not_applicable reason=s:2000 supersedes_id=id?',
'Incident': 'classroom_id=id student_profile_id=id assignment_id=id reported_at=dt description=s:3000 state=e:open|resolved|rejected',
'TestRun': 'github_run_id=gh attempt=int workflow_id=gh sha=sha provider_state=s:80 conclusion=s:80? report_state=e:pending|valid|invalid|missing|expired trust=e:formative results=[]@TestResult',
'Evaluation': 'submission_id=id evaluator_id=id scale_version_id=id state=e:in_progress|completed',
'DraftGrade': 'eligible_deleted_evidence_grant_id=id? evaluation_id=id score=dec? maximum=dec feedback=s:20000? internal_notes=s:20000? completeness=e:incomplete|ready',
'Publication': 'historical_code_unavailable=bool evidence_explanation=s:2000? deletion_operation_id=id? acceptance_id=id evaluation_id=id submission_id=id score=dec maximum=dec scale_version_id=id feedback=s:20000 publisher_id=id published_at=dt',
'Withdrawal': 'publication_id=id teacher_id=id withdrawn_at=dt student_reason=s:2000',
'Snapshot': 'deletion_operation?=@DeletionOperationReference submission_id=id sha=sha capture_state=e:pending|capturing|available|retryable_failure|blocked_by_quota|blocked_by_size|blocked_by_structure|source_unavailable digest=digest? size_bytes=bytes? captured_at=dt? capture_version=s:100 origin=s:300 manifest=@SnapshotManifest retain_until=dt? deletion_state=e:scheduled|pending|held|in_progress|failed|verified? content_available=bool',
'RetentionHold': 'snapshot_id=id reason=s:2000 responsible_user_id=id review_at=dt released_at=dt?',
'QuotaPolicy': 'version=int compressed_limit_bytes=bytes expanded_limit_bytes=bytes entries_limit=int course_limit_bytes=bytes institution_limit_bytes=bytes warning_percentages=[]int',
'RetentionPolicy': 'version=int close_months=int pending_days=int backup_purge_guarantee=e:unverified|provider_verified',
'Operation': 'deletion_operation_version=int? deletion_operation_id=id? deletion_phase=e:prepared|cancel_pending|canceled|start_pending|destructive_started|verified? access_cleanup=@ExternalCleanup? kind=s:80 state=e:pending|running|completed|failed|blocked resource_id=id? error_code=s:80?',
'Notice': 'kind=s:100 resource_id=id message=s:1000 read_at=dt?',
'ExportJob': 'classroom_id=id state=e:pending|running|completed|failed expires_at=dt',
}
for n, f in RESOURCES.items(): schema(n, f, True)
# Institutional entity is itself global; do not imply a parent tenant column.
for field in ['institution_id']:
    S['Institution']['properties'].pop(field); S['Institution']['required'].remove(field)
for n in ['QuotaInput','QuotaPolicy']:
    S[n]['properties']['warning_percentages']={'type':'array','minItems':1,'maxItems':5,'uniqueItems':True,'items':{'type':'integer','minimum':1,'maximum':99}}
for n in ['RetentionChange','RetentionPolicy']:
    for field in ['close_months','pending_days']: S[n]['properties'][field]['minimum']=1

# Approved documentary repairs 2026-09-17: ACR-001..011, AD-5/7; AD-12..18 remain proposed.
schema('DeletionOperationReference', 'id=id operation_id=id row_version=int')
schema('TimestampProvenance', 'source=e:trusted_backend_full_request instance_id=s:128 clock_status=e:trusted|uncertain uncertainty_ms=int? sampled_at=dt context_id=s:128')
schema('ExternalCleanup', 'state=e:not_required|pending|observed_absent|blocked observed_at=dt? unresolved_prior_effects=bool reason_code=s:80?')
schema('RequestSummary', 'request_id=id request_sequence=int validation_state=e:received|validating|confirmed|needs_review|rejected submission_id=id?')
schema('DeletedEvidenceExceptionInput', 'grant_id=id reason=s:2000 evidentiary_basis=s:5000 student_explanation=s:2000')
schema('SubmissionRequestStatus', DEFS['SubmissionReceipt'] + ' row_version=int current_resolution_id=id?')
schema('SubmissionRejectInput', 'decision=e:reject reason=s:2000 expected_version=int confirm=true')
schema('SubmissionConfirmExceptionInput', 'decision=e:confirm_exception classification=e:on_time|late|exempt|not_applicable reason=s:2000 evidence_reference=s:1000 expected_version=int confirm=true')
schema('SubmissionReclassifyInput', 'decision=e:reclassify classification=e:on_time|late|exempt|not_applicable reason=s:2000 evidence_reference?=s:1000 expected_version=int confirm=true')
S['SubmissionResolutionInput']={'oneOf':[ref(x) for x in ['SubmissionRejectInput','SubmissionConfirmExceptionInput','SubmissionReclassifyInput']], 'discriminator':{'propertyName':'decision'}}
schema('IncidentResolutionInput', 'decision=e:resolve_incident classification=e:unresolved|on_time|late|exempt|not_applicable reason=s:2000 evidence_reference?=s:1000 expected_version=int confirm=true')
S.pop('ResolutionInput')
# ACR-001: reject needs no activation context; approve does.
S['IdentityDecision']['allOf']=[{'if':{'properties':{'decision':{'const':'approve'}},'required':['decision']},'then':{'required':['approval_context']}}]
# AD-7: exception grants target one course, submission, evaluation and draft version.
for name in ['GrantInput']:
    S[name]['allOf']=[{'if':{'properties':{'capabilities':{'contains':{'const':'publish_without_retained_code'}}},'required':['capabilities']},'then':{'required':['submission_id','evaluation_id','draft_version'],'properties':{'classroom_ids':{'minItems':1,'maxItems':1}}}}]
# Nonblank reasons/evidence must remain meaningful; whitespace-only is rejected.
for name,value in S.items():
    for field,shape in value.get('properties',{}).items():
        if field in {'reason','evidentiary_basis','student_explanation','student_reason'} and shape.get('type')=='string':
            shape['minLength']=1; shape['pattern']=r'\S'
for name in ['SubmissionReceipt','SubmissionRequestStatus','RequestSummary']:
    S[name]['properties']['request_sequence']['minimum']=1
S['Submission']['properties']['revision']['minimum']=1
S['SubmissionReceipt']['description']='Immutable original acknowledgement. persistence_recorded_at is the DB persistence-stage sample, not an exact commit timestamp; a receipt exists only after durable commit. Null effective_deadline is interpreted using deadline_status. policy uncertainty remains needs_review.'
S['SubmissionRequestStatus']['description']='Current request projection; row_version is the mutable request CAS token. Original POST replay remains unchanged.'
S['CurrentGrade']['description']='latest_submission_revision is max confirmed intake sequence; evaluated_revision belongs only to current publication. latest_request includes pending/rejected. No grade inheritance.'
S['Repository']['description']='Cleanup is a safe summary; observed_absent requires no unresolved older own grant and an observed_at. No instantaneous external revocation guarantee.'
S['IdentityRequestStaff']['description']='Opaque approval_context binds inspected profile/enrollment/authority versions without disclosing unauthorized courses.'
S['Snapshot']['description']='deletion_operation is present only for authorized cancellation/evidence operators; supplies the worker operation backlink and inspected deletion-operation version. Student view omits it.'
S['DraftGrade']['description']='eligible_deleted_evidence_grant_id is the eligible exact-scope grant for the current teacher/draft or null; TA gets null. Permission and grant consumption are rechecked on publication.'
S['Operation']['description']='Operation.row_version belongs to the operation projection; cancellation expected_version compares deletion_operation_version, not the queue/outbox version. Details exposed only to scoped operators.'
S['PublicationInput']['description']='Verified-deleted evidence blocks ordinary publication. Only teacher with current scoped institutional exception may use deleted_evidence_exception. In-progress purge still conflicts; post-deletion recapture is out of MVP.'

paths = {}
params = {
'IdempotencyKey': {'name':'Idempotency-Key','in':'header','required':True,'schema':{'type':'string','pattern':'^[A-Za-z0-9._:-]{16,128}$'}},
'Csrf': {'name':'X-CSRF-Token','in':'header','required':True,'schema':{'type':'string','minLength':16,'maxLength':256}},
}
def route(line):
    method,path,op,out,body,status,policy=line.split(';', 6)
    status=int(status); public=policy.startswith('PUBLIC:'); page=out.endswith('[]'); out=out.removesuffix('[]')
    par=[{'name':x,'in':'path','required':True,'schema':typ('s:256' if x=='token' else 'id')} for x in re.findall(r'{([^}]+)}',path)]
    mut=method in ['post','put','patch','delete']
    if mut and not public: par += [{'$ref':'#/components/parameters/'+x} for x in ['IdempotencyKey','Csrf']]
    if page:
        name=out+'Page'; schema(name,'items=[]@'+out+' next_cursor=s:1000?');out=name
        par += [{'name':'limit','in':'query','schema':{'type':'integer','minimum':1,'maximum':100,'default':25}},{'name':'cursor','in':'query','schema':typ('s:1000')}]
    response={'description':'Durable operation accepted; not necessarily completed' if status==202 else 'Success'}
    if out.startswith('binary:'): response['content']={out[7:]:{'schema':{'type':'string','format':'binary'}}}
    elif out!='-': response['content']={'application/json':{'schema':ref(out)}}
    if mut and not public: response['headers']={'Idempotent-Replayed':{'schema':{'type':'boolean'}},'Location':{'schema':{'type':'string'},'description':'Durable resource URL when applicable'}}
    responses={str(status):response}
    for code in [400,401,403,404,409,410,413,422,429,503]: responses[str(code)]={'description':'See API.md error mapping','content':{'application/json':{'schema':ref('Error')}}}
    responses['429']['headers']={'Retry-After':{'schema':{'type':'integer','minimum':1}}}
    operation={'operationId':op,'summary':re.sub(r'([A-Z])',r' \1',op).strip(),'x-authorization':policy,'description':'RECOMMENDATION. Enforce API.md and SECURITY.md; identifiers do not confer authority.','parameters':par,'responses':responses}
    if public: operation['security']=[]
    if body=='CSV': operation['requestBody']={'required':True,'content':{'text/csv':{'schema':{'type':'string','maxLength':5242880,'description':'UTF-8 header academic_identifier,name,email. At most 5000 rows. Preview before apply.'}}}}
    elif body!='-': operation['requestBody']={'required':True,'content':{'application/json':{'schema':ref(body)}}}
    paths.setdefault(path,{})[method]=operation

ROUTES='''get;/auth/github/start;startGithubLogin;-;-;302;PUBLIC: browser-bound OAuth state/PKCE
get;/auth/github/callback;completeGithubLogin;-;-;302;PUBLIC: one-use OAuth transaction/browser binding
post;/auth/logout;logout;-;-;204;Current session
get;/me;getMe;Me;-;200;Current session
get;/institutions;listMyInstitutions;Institution[];-;200;Only current user's institutions
post;/institutions;createInstitution;Institution;InstitutionInput;201;Super Admin
get;/institutions/{id}/memberships;listInstitutionMembers;Membership[];-;200;Institution Admin
post;/institutions/{id}/memberships;addInstitutionMember;Membership;MembershipInput;201;Institution Admin, only admin/member roles
patch;/memberships/{id};changeMembership;Membership;MembershipChange;200;Scope administrator/teacher, disallow last-teacher removal
post;/institutions/{id}/authorization-grants;createAuthorizationGrant;AuthorizationGrant;GrantInput;201;Institution Admin or Super Admin, scoped reasoned grant
post;/authorization-grants/{id}/revocations;revokeGrant;AuthorizationGrant;Reason;200;Grant issuer or Institution Admin
post;/organizations;connectOrganization;Organization;OrganizationConnect;201;Institution Admin or teacher connect_org, verify provider authority
get;/institutions/{id}/organizations;listOrganizations;Organization[];-;200;Institution Admin or authorized teacher
get;/organizations/{id}/capabilities;getOrganizationCapabilities;Capabilities;-;200;Institution Admin or authorized teacher, cached verified state
post;/organizations/{id}/reconciliations;reconcileOrganization;Operation;Reason;202;Institution Admin or teacher connect_org
post;/classrooms;createClassroom;Classroom;ClassroomInput;201;Institution Admin or teacher create_course
get;/institutions/{id}/classrooms;listClassrooms;Classroom[];-;200;Only authorized courses
get;/classrooms/{id};getClassroom;Classroom;-;200;Course staff or enrolled student
patch;/classrooms/{id};updateClassroom;Classroom;ClassroomChange;200;Course teacher
get;/classrooms/{id}/dashboard;getDashboard;Dashboard;-;200;Teacher or TA submissions_read, staff projection
get;/classrooms/{id}/memberships;listCourseStaff;Membership[];-;200;Course teacher
post;/classrooms/{id}/memberships;addCourseStaff;Membership;MembershipInput;201;Institution Admin or teacher, only teacher/ta roles
post;/classrooms/{id}/academic-close;closeCourse;Classroom;Confirm;200;Course teacher or Institution Admin
post;/classrooms/{id}/academic-reopen;reopenCourse;Classroom;Confirm;200;Course teacher or Institution Admin, synchronous course retention fence; disclose prior purge claims
get;/classrooms/{id}/roster;listRoster;RosterEntry[];-;200;Teacher or TA roster_read, no student enumeration
post;/classrooms/{id}/roster;createRosterEntry;RosterEntry;RosterInput;201;Course teacher
post;/roster-entries/{id}/withdrawals;withdrawRosterEntry;RosterEntry;Confirm;200;Course teacher, preserve evidence/reconcile access
post;/classrooms/{id}/roster-imports;previewRosterImport;ImportPreview;CSV;202;Course teacher
get;/roster-imports/{id};getRosterImport;ImportPreview;-;200;Authorized course teacher
post;/roster-imports/{id}/commit;commitRosterImport;Operation;ImportCommit;202;Course teacher, no unresolved row errors
post;/identity-link-requests;requestIdentityLink;IdentityRequestReceipt;IdentityRequestInput;202;Authenticated user requesting own binding, same safe receipt for unmatched identifier
get;/identity-link-requests/{id};getOwnIdentityRequest;IdentityRequestReceipt;-;200;Request owner, nonenumerating projection
get;/classrooms/{id}/identity-link-requests;listIdentityRequests;IdentityRequestStaff[];-;200;Course teacher
post;/identity-link-requests/{id}/decision;decideIdentityLink;IdentityRequestStaff;IdentityDecision;200;Teacher with all affected course authority or scoped grant for every activation; unmatched cannot approve; reject requires request course only
post;/identity-bindings/{id}/corrections;correctIdentityBinding;IdentityBinding;BindingCorrection;200;Teacher authorized across affected courses or explicit correction grant; profile approval_context and binding CAS
get;/classrooms/{id}/assignments;listAssignments;Assignment[];-;200;Course staff or verified student, student sees published only
post;/classrooms/{id}/assignments;createAssignment;Assignment;AssignmentInput;201;Course teacher
get;/assignments/{id};getAssignment;Assignment;-;200;Course access, student published only
post;/assignments/{id}/versions;createAssignmentVersion;AssignmentVersion;VersionInput;201;Course teacher, no historical reinterpretation
get;/assignments/{id}/versions;listAssignmentVersions;AssignmentVersion[];-;200;Teacher or student applicable published version only
post;/assignment-versions/{id}/publications;publishAssignmentVersion;AssignmentVersion;Confirm;200;Course teacher, template/capacity preflight
post;/assignments/{id}/close;closeAssignment;Assignment;Confirm;200;Course teacher, no Git lock
post;/assignments/{id}/invitations;rotateInvitation;InvitationCreated;InvitationInput;201;Course teacher, disable previous token
post;/assignment-invitations/{id}/disable;disableInvitation;Invitation;Reason;200;Course teacher
get;/invites/{token};previewInvitation;InvitationPreview;-;200;PUBLIC: minimal context, no roster or identity data
post;/assignments/{id}/accept;acceptAssignment;AcceptedAssignment;AcceptanceInput;202;Verified active student enrollment, invitation alone insufficient
get;/assignments/{id}/acceptances;listAcceptances;AcceptedAssignment[];-;200;Teacher/TA submissions_read, student own only
get;/accepted-assignments/{id};getAcceptance;AcceptedAssignment;-;200;Owning student or scoped staff
get;/accepted-assignments/{id}/repository;getRepository;Repository;-;200;Owning student or scoped staff
post;/repositories/{id}/retries;retryProvisioning;Operation;Reason;202;Owning student retryable failure or teacher, no ambiguous adoption
post;/accepted-assignments/{id}/extensions;grantExtension;Extension;ExtensionInput;201;Course teacher
get;/accepted-assignments/{id}/submission-preview;previewSubmission;SubmissionPreview;-;200;Owning verified student, server-bound observation
post;/accepted-assignments/{id}/submissions;submitRevision;SubmissionReceipt;SubmissionInput;202;Owning verified student, durable receipt before acknowledgment
get;/accepted-assignments/{id}/submissions;listSubmissionRevisions;Submission[];-;200;Owning student or staff submissions_read
get;/accepted-assignments/{id}/submission-requests;listAcceptanceSubmissionRequests;SubmissionRequestStatus[];-;200;Owning currently authorized student or scoped staff submissions_read
get;/classrooms/{id}/submission-requests;listCourseSubmissionRequests;SubmissionRequestStatus[];-;200;Teacher or TA submissions_read, course-scoped filters
post;/deletion-operations/{id}/cancellations;cancelDeletionOperation;Operation;Confirm;202;Institution Admin or time-limited scoped evidence operator grant, expected version; only before destructive-start authorization
get;/submission-requests/{id};getSubmissionRequest;SubmissionRequestStatus;-;200;Owning student or staff submissions_read
post;/submission-requests/{id}/resolutions;resolveSubmissionRequest;AcademicResolution;SubmissionResolutionInput;201;Course teacher, request CAS and explicit action; no fake timestamp or invalid SHA
post;/classrooms/{id}/incidents;recordAcademicIncident;Incident;IncidentInput;201;Course teacher, not a fabricated receipt
post;/incidents/{id}/resolutions;resolveAcademicIncident;AcademicResolution;IncidentResolutionInput;201;Course teacher, incident CAS; never creates a Submission
get;/submissions/{id};getSubmission;Submission;-;200;Owning student or staff submissions_read
get;/submissions/{id}/test-results;getSubmissionTestRuns;TestRun[];-;200;Owning student or staff submissions_read, exact SHA
post;/submissions/{id}/evaluations;createEvaluation;Evaluation;EvaluationInput;201;Teacher or TA grade_draft, fixed revision
get;/submissions/{id}/evaluations;listEvaluations;Evaluation[];-;200;Teacher or TA grade_draft, not student
post;/evaluations/{id}/evidence;attachEvaluationEvidence;Evaluation;EvidenceInput;200;Teacher or TA grade_draft, matching repo/SHA
get;/evaluations/{id}/draft-grade;getDraftGrade;DraftGrade;-;200;Teacher or TA grade_draft only
put;/evaluations/{id}/draft-grade;saveDraftGrade;DraftGrade;DraftInput;200;Teacher or TA grade_draft, incomplete allowed
post;/evaluations/{id}/publications;publishGrade;Publication;PublicationInput;201;Teacher only, draft/current-grade CAS and retention transaction; verified deletion requires scoped institutional exception
post;/grade-publications/{id}/withdrawals;withdrawGrade;Withdrawal;WithdrawalInput;201;Teacher only, exact current publication
get;/accepted-assignments/{id}/published-grade;getCurrentGrade;CurrentGrade;-;200;Owning student or staff grades_read
get;/accepted-assignments/{id}/grade-history;getStudentSafeGradeHistory;GradeHistoryEvent[];-;200;Owning student or scoped staff, no internal notes
get;/accepted-assignments/{id}/staff-grade-history;getStaffGradeHistory;StaffGradeHistoryEvent[];-;200;Teacher or TA grade_draft, internal notes permitted
get;/submissions/{id}/snapshot;getSnapshot;Snapshot;-;200;Owning student or evidence-authorized staff; cancellation operator may read scoped metadata/reference
get;/snapshots/{id}/content;downloadSnapshot;binary:application/octet-stream;-;200;Owning student, teacher, TA evidence_read or scoped evidence grant, audit download
post;/snapshots/{id}/retries;retrySnapshotCapture;Operation;Reason;202;Teacher or institutional evidence operator, deterministic block resolved; no retry after verified deletion or active purge fence
post;/snapshots/{id}/holds;placeRetentionHold;RetentionHold;HoldInput;201;Teacher or Institution Admin, conflict on purge fence
post;/retention-holds/{id}/release;releaseRetentionHold;RetentionHold;Confirm;200;Authorized teacher or Institution Admin
get;/institutions/{id}/quota-policy;getQuotaPolicy;QuotaPolicy;-;200;Institution Admin
put;/institutions/{id}/quota-policy;changeQuotaPolicy;QuotaPolicy;QuotaInput;200;Institution Admin, versioned audited config
get;/institutions/{id}/storage-usage;getInstitutionStorageUsage;StorageUsage;-;200;Institution Admin
get;/classrooms/{id}/storage-usage;getCourseStorageUsage;StorageUsage;-;200;Teacher or Institution Admin
get;/classrooms/{id}/capacity-forecast;getCapacityForecast;CapacityForecast;-;200;Teacher or Institution Admin, estimate not reservation
get;/institutions/{id}/retention-policy;getRetentionPolicy;RetentionPolicy;-;200;Institution Admin
put;/institutions/{id}/retention-policy;changeRetentionPolicy;RetentionPolicy;RetentionChange;200;Institution Admin, preserve existing promises
post;/institutions/{id}/retention-migrations;migrateRetentionPolicy;Operation;RetentionMigrationInput;202;Institution Admin, explicit audited migration
post;/classrooms/{id}/grade-exports;exportGrades;ExportJob;Reason;202;Course teacher, formula-safe CSV
get;/grade-exports/{id};getGradeExport;ExportJob;-;200;Exporting teacher with current authority
get;/grade-exports/{id}/content;downloadGradeExport;binary:text/csv;-;200;Exporting teacher with current authority, expiring private content
get;/operations/{id};getOperation;Operation;-;200;Operation owner/scoped staff, no secret payload
post;/operations/{id}/retries;retryOperation;Operation;Reason;202;Scoped operator per job kind, no grade mutation
get;/institutions/{id}/audit;listAuditEvents;AuditEvent[];-;200;Institution Admin or scoped audit grant, redacted projection
get;/me/notices;listNotices;Notice[];-;200;Notice recipient only
post;/notices/{id}/read;markNoticeRead;Notice;Reason;200;Notice recipient only
post;/webhooks/github;receiveGithubWebhook;WebhookAcknowledgement;-;202;PUBLIC: HMAC raw-body, verified routing, durable inbox
get;/health/live;getLiveness;Health;-;200;PUBLIC: minimal process health
get;/health/ready;getReadiness;Health;-;200;PUBLIC: minimal readiness, no dependency secrets'''
for line in ROUTES.splitlines(): route(line)
for path in ['/accepted-assignments/{id}/submission-requests','/classrooms/{id}/submission-requests']:
    paths[path]['get']['parameters'].append({'name':'validation_state','in':'query','schema':typ('e:received|validating|confirmed|needs_review|rejected')})
    paths[path]['get']['description']='Current durable request collection; stable cursor bound to scope/filter/order, authorization per page. Live status filters require refresh to discover items transitioning behind a previous cursor. No local key required.'
paths['/classrooms/{id}/submission-requests']['get']['parameters'].append({'name':'assignment_id','in':'query','schema':typ('id'),'description':'Must belong to this classroom.'})
for u in ['/auth/github/start','/auth/github/callback']:
    paths[u]['get']['responses']['302']['headers']={'Location':{'schema':{'type':'string'},'description':'Allowlisted redirect'}}
paths['/auth/github/callback']['get']['parameters']=[{'name':n,'in':'query','required':True,'schema':typ('s:500')} for n in ['code','state']]
wh=paths['/webhooks/github']['post']
wh['parameters']=[{'name':n,'in':'header','required':True,'schema':typ('s:256')} for n in ['X-Hub-Signature-256','X-GitHub-Delivery','X-GitHub-Event']]
wh['requestBody']={'required':True,'content':{'application/json':{'schema':{'type':'object','description':'Untrusted provider payload; validate raw HMAC before parsing. Raw max 5 MiB; event-specific validation.'}}}}
d={'openapi':'3.1.1','info':{'title':'Academic Programming Platform — proposed MVP','version':'0.2.0-design','description':'Preimplementation contract. AD-1..AD-11 approved; mechanics proposed. No application implemented.'},'servers':[{'url':'/api/v1'}],'security':[{'SessionCookie':[]}],'paths':paths,'components':{'securitySchemes':{'SessionCookie':{'type':'apiKey','in':'cookie','name':'academic_session'}},'parameters':params,'schemas':S}}
(ROOT/'openapi.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'paths':len(paths),'operations':sum(map(len,paths.values())),'schemas':len(S)}))
