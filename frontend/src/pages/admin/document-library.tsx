import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import RoleGuard from '@/components/RoleGuard';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserRole } from '@mindelta/shared';
import { useSignedDownload } from '@/hooks/useSignedDownload';
import {
  archiveDocument,
  DocumentResource,
  DocumentState,
  listDocuments,
  reindexDocument,
  updateDocument,
  uploadDocument,
} from '@/lib/api/documents';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TagIcon,
  BuildingOfficeIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

const roleOptions = [
  { value: UserRole.LEARNER, label: 'Learners' },
  { value: UserRole.INSTRUCTOR, label: 'Instructors' },
  { value: UserRole.ADMIN, label: 'Admins' },
  { value: UserRole.SUPER_ADMIN, label: 'Super Admins' },
];

type StateFilter = 'ALL' | DocumentState;
type OcrFilter = 'ALL' | 'INDEXED' | 'PENDING' | 'FAILED' | 'UNAVAILABLE' | 'NO_OCR';

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    q: '',
    tags: '',
    department: '',
    state: 'ACTIVE' as StateFilter,
    ocrStatus: 'ALL' as OcrFilter,
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: '',
    department: '',
    retentionUntil: '',
    classification: 'Internal',
    accessDepartments: '',
    accessRoles: [] as UserRole[],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanIntake, setScanIntake] = useState(false);
  const downloadDocument = useSignedDownload();

  const fetchDocuments = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const state = nextFilters.state === 'ALL' ? undefined : nextFilters.state;
      const tags = parseCommaList(nextFilters.tags);
      const docs = await listDocuments({
        q: nextFilters.q || undefined,
        tags: tags.length ? tags : undefined,
        department: nextFilters.department || undefined,
        state,
      });
      setDocuments(docs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const totals = useMemo(() => {
    const active = documents.filter((doc) => doc.state === 'ACTIVE').length;
    const archived = documents.filter((doc) => doc.state === 'ARCHIVED').length;
    const totalBytes = documents.reduce((sum, doc) => sum + (Number(doc.sizeBytes) || 0), 0);
    const indexed = documents.filter((doc) => !!doc.textContent).length;
    const scanIntake = documents.filter((doc) => !!doc.metadata?.scanIntake).length;
    const ocrPending = documents.filter((doc) => {
      const status = getOcrStatus(doc).status;
      return status === 'pending' || status === 'queued' || status === 'processing';
    }).length;
    const ocrFailed = documents.filter((doc) => getOcrStatus(doc).status === 'failed').length;
    const ocrUnavailable = documents.filter((doc) => getOcrStatus(doc).status === 'unavailable').length;
    return { active, archived, totalBytes, indexed, scanIntake, ocrPending, ocrFailed, ocrUnavailable };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    const tagFilters = parseCommaList(filters.tags);

    return documents.filter((doc) => {
      if (filters.state !== 'ALL' && doc.state !== filters.state) return false;
      if (filters.department && doc.department?.toLowerCase() !== filters.department.trim().toLowerCase()) return false;
      if (needle) {
        const inTitle = doc.title.toLowerCase().includes(needle);
        const inText = doc.textContent?.toLowerCase().includes(needle);
        if (!inTitle && !inText) return false;
      }
      if (tagFilters.length) {
        const docTags = doc.tags || [];
        const hasTag = tagFilters.some((tag) => docTags.includes(tag));
        if (!hasTag) return false;
      }
      const ocrInfo = getOcrStatus(doc);
      switch (filters.ocrStatus) {
        case 'INDEXED':
          return ocrInfo.status === 'succeeded';
        case 'FAILED':
          return ocrInfo.status === 'failed';
        case 'UNAVAILABLE':
          return ocrInfo.status === 'unavailable';
        case 'NO_OCR':
          return ocrInfo.status === 'skipped';
        case 'PENDING':
          return ocrInfo.status === 'pending' || ocrInfo.status === 'processing';
        default:
          return true;
      }
    });
  }, [documents, filters]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    const title = uploadForm.title.trim() || selectedFile.name;
    if (!title) {
      setError('Title is required.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const tags = parseCommaList(uploadForm.tags);
      const accessDepartments = parseCommaList(uploadForm.accessDepartments);

      await uploadDocument({
        file: selectedFile,
        title,
        description: uploadForm.description || undefined,
        tags,
        department: uploadForm.department || undefined,
        retentionUntil: uploadForm.retentionUntil || undefined,
        classification: uploadForm.classification || undefined,
        accessRoles: uploadForm.accessRoles.length ? uploadForm.accessRoles : undefined,
        accessDepartments: accessDepartments.length ? accessDepartments : undefined,
        scanIntake,
      });

      setToast(scanIntake ? 'Scan uploaded and queued for OCR indexing.' : 'Document uploaded successfully.');
      setSelectedFile(null);
      setScanIntake(false);
      setUploadForm({
        title: '',
        description: '',
        tags: '',
        department: '',
        retentionUntil: '',
        classification: 'Internal',
        accessDepartments: '',
        accessRoles: [],
      });
      fetchDocuments();
    } catch (e: any) {
      setError(e?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleArchive = async (doc: DocumentResource) => {
    try {
      if (doc.state === 'ACTIVE') {
        await archiveDocument(doc.id);
      } else {
        await updateDocument(doc.id, { state: 'ACTIVE' });
      }
      fetchDocuments();
    } catch (e: any) {
      setError(e?.message || 'Failed to update document');
    }
  };

  const handleReindex = async (doc: DocumentResource) => {
    setReindexingId(doc.id);
    setError(null);
    try {
      await reindexDocument(doc.id);
      setToast('OCR reindexing started.');
      fetchDocuments();
    } catch (e: any) {
      setError(e?.message || 'Failed to reindex OCR');
    } finally {
      setReindexingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDownload = async (doc: DocumentResource) => {
    try {
      await downloadDocument(doc.fileUrl, (doc.metadata as any)?.courseId);
    } catch {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const toggleRole = (role: UserRole) => {
    setUploadForm((prev) => {
      const nextRoles = prev.accessRoles.includes(role)
        ? prev.accessRoles.filter((r) => r !== role)
        : [...prev.accessRoles, role];
      return { ...prev, accessRoles: nextRoles };
    });
  };

  return (
    <>
      <Head>
        <title>Document Library - Admin</title>
        <meta name="description" content="Manage the corporate document library and scanned content." />
      </Head>

      <AdminLayout
        title="Document Library"
        subtitle="Upload, curate, and audit internal learning documents with retention controls."
      >
        <RoleGuard allow={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
          <div className="space-y-6">
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-forest-200 bg-forest-50 px-4 py-3 text-sm text-forest-700"
              >
                {toast}
              </motion.div>
            )}

            {error && (
              <div className="rounded-md border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-1 space-y-6">
                <div className="bg-white rounded-md shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-charcoal">Upload Intake</h2>
                    <span className="inline-flex items-center gap-1 text-xs text-stone">
                      <DocumentCheckIcon className="h-4 w-4" />
                      OCR-ready
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-md p-5 text-center cursor-pointer hover:border-primary-300 transition">
                      <ArrowUpTrayIcon className="h-6 w-6 text-primary-600 mb-2" />
                      <span className="text-sm text-stone">
                        {selectedFile ? selectedFile.name : 'Drop a PDF, image, or doc file here'}
                      </span>
                      <span className="text-xs text-pewter">Max 100MB per file</span>
                      <span className="text-[11px] text-pewter">PDF and images supported for OCR</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                          if (file && !uploadForm.title) {
                            setUploadForm((prev) => ({
                              ...prev,
                              title: file.name.replace(/\.[^/.]+$/, ''),
                            }));
                          }
                        }}
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs font-medium text-stone">Title</label>
                        <input
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Document title"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone">Description</label>
                        <textarea
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Short summary for catalog search"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-stone">Department</label>
                        <input
                          value={uploadForm.department}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, department: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Risk, HR, Ops"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone">Classification</label>
                        <select
                          value={uploadForm.classification}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, classification: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                          {['Public', 'Internal', 'Confidential', 'Restricted'].map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-stone">Tags</label>
                        <input
                          value={uploadForm.tags}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, tags: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="compliance, onboarding"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-stone">Retention Until</label>
                        <input
                          type="date"
                          value={uploadForm.retentionUntil}
                          onChange={(e) => setUploadForm((prev) => ({ ...prev, retentionUntil: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-stone">Access Departments</label>
                      <input
                        value={uploadForm.accessDepartments}
                        onChange={(e) => setUploadForm((prev) => ({ ...prev, accessDepartments: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Comma separated departments"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-stone">Access Roles</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {roleOptions.map((role) => (
                          <label key={role.value} className="flex items-center gap-2 text-xs text-stone">
                            <input
                              type="checkbox"
                              checked={uploadForm.accessRoles.includes(role.value)}
                              onChange={() => toggleRole(role.value)}
                              className="rounded border-border/60 text-primary-600 focus:ring-primary-500"
                            />
                            {role.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-md border border-border/60 px-3 py-2 text-sm text-stone">
                      <input
                        type="checkbox"
                        checked={scanIntake}
                        onChange={(e) => setScanIntake(e.target.checked)}
                        className="rounded border-border/60 text-primary-600 focus:ring-primary-500"
                      />
                      Flag as scan intake (OCR indexing will run after upload)
                    </label>
                    <p className="text-xs text-pewter">
                      OCR runs in the background. Status updates appear in the catalog.
                    </p>

                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                        uploading ? 'bg-stone' : 'bg-primary-600 hover:bg-primary-700'
                      }`}
                    >
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-md shadow-sm p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-charcoal">Filters</h2>

                  <div className="space-y-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-4 w-4 text-pewter absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={filters.q}
                        onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
                        className="w-full rounded-md border border-border/60 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Search title or extracted text"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <TagIcon className="h-4 w-4 text-pewter absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          value={filters.tags}
                          onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value }))}
                          className="w-full rounded-md border border-border/60 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Tags"
                        />
                      </div>
                      <div className="relative">
                        <BuildingOfficeIcon className="h-4 w-4 text-pewter absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          value={filters.department}
                          onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                          className="w-full rounded-md border border-border/60 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Department"
                        />
                      </div>
                    </div>
                    <select
                      value={filters.state}
                      onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value as StateFilter }))}
                      className="w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="ALL">All states</option>
                      <option value="ACTIVE">Active</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                    <select
                      value={filters.ocrStatus}
                      onChange={(e) => setFilters((prev) => ({ ...prev, ocrStatus: e.target.value as OcrFilter }))}
                      className="w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="ALL">All OCR states</option>
                      <option value="INDEXED">Indexed</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="NO_OCR">No OCR</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchDocuments()}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Apply Filters
                      </button>
                      <button
                        onClick={() => {
                          const resetFilters = { q: '', tags: '', department: '', state: 'ACTIVE' as StateFilter, ocrStatus: 'ALL' as OcrFilter };
                          setFilters(resetFilters);
                          fetchDocuments(resetFilters);
                        }}
                        className="flex-1 rounded-md border border-border/60 px-3 py-2 text-sm text-stone hover:bg-paper"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <DocumentTextIcon className="h-4 w-4" />
                      Total documents
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">
                      {documents.length}
                    </div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <DocumentCheckIcon className="h-4 w-4" />
                      Indexed
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.indexed}</div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      Scan intake
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.scanIntake}</div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <ClockIcon className="h-4 w-4" />
                      OCR pending
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.ocrPending}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <ShieldCheckIcon className="h-4 w-4" />
                      Active
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.active}</div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <ArchiveBoxIcon className="h-4 w-4" />
                      Archived
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.archived}</div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <DocumentTextIcon className="h-4 w-4" />
                      OCR failed
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.ocrFailed}</div>
                  </div>
                  <div className="bg-white rounded-md shadow p-4">
                    <div className="flex items-center gap-2 text-sm text-stone">
                      <ShieldCheckIcon className="h-4 w-4" />
                      OCR unavailable
                    </div>
                    <div className="mt-2 text-2xl font-bold text-charcoal">{totals.ocrUnavailable}</div>
                  </div>
                </div>

                <div className="bg-white rounded-md shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-charcoal">Document Catalog</h2>
                    <div className="text-right text-xs text-stone">
                      <div>Storage used: {formatBytes(totals.totalBytes)}</div>
                      <div>Showing {filteredDocuments.length} of {documents.length}</div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-12 text-center text-stone">Loading documents...</div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="py-12 text-center text-stone">
                      {documents.length === 0
                        ? 'No documents yet. Upload a file to start your library.'
                        : 'No documents match the current filters.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDocuments.map((doc) => {
                        const retentionDate = doc.retentionUntil ? new Date(doc.retentionUntil) : null;
                        const retentionExpired = retentionDate ? retentionDate.getTime() < Date.now() : false;
                        const ocrInfo = getOcrStatus(doc);
                        return (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-border/60 rounded-md p-4 hover:shadow-sm transition"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-charcoal">{doc.title}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    doc.state === 'ACTIVE'
                                      ? 'bg-forest-100 text-forest-700'
                                      : 'bg-forest-100 text-stone'
                                  }`}>
                                    {doc.state}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${ocrInfo.badgeClass}`}>
                                    {ocrInfo.label}
                                  </span>
                                  {doc.metadata?.scanIntake && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-forest-50 text-forest-700">Scan intake</span>
                                  )}
                                </div>
                                {doc.description && (
                                  <p className="text-sm text-stone">{doc.description}</p>
                                )}
                                {doc.textContent && (
                                  <p className="text-xs text-stone">
                                    {doc.textContent.length > 160 ? `${doc.textContent.slice(0, 160)}...` : doc.textContent}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  {doc.tags?.map((tag) => (
                                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-forest-100 text-stone">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-stone">
                                  <div className="flex items-center gap-1">
                                    <BuildingOfficeIcon className="h-3.5 w-3.5" />
                                    {doc.department || 'Unassigned'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ShieldCheckIcon className="h-3.5 w-3.5" />
                                    {doc.classification || 'Internal'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-3.5 w-3.5" />
                                    {retentionDate ? retentionDate.toLocaleDateString() : 'No retention'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DocumentTextIcon className="h-3.5 w-3.5" />
                                    {formatBytes(Number(doc.sizeBytes) || 0)}
                                  </div>
                                </div>
                                {(doc.accessRoles?.length || doc.accessDepartments?.length) && (
                                  <div className="flex flex-wrap gap-2 text-xs text-stone">
                                    {doc.accessDepartments?.map((dept) => (
                                      <span key={dept} className="rounded-full bg-forest-50 px-2 py-0.5 text-forest-700">
                                        {dept}
                                      </span>
                                    ))}
                                    {doc.accessRoles?.map((role) => (
                                      <span key={role} className="rounded-full bg-forest-50 px-2 py-0.5 text-forest-700">
                                        {role.replace('_', ' ').toLowerCase()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {retentionExpired && (
                                  <p className="text-xs text-terracotta-600">Retention date passed. Review for archival or deletion.</p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-md border border-border/60 px-3 py-2 text-xs font-medium text-charcoal hover:bg-paper"
                                >
                                  View file
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDownload(doc)}
                                  className="inline-flex items-center justify-center rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100"
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => handleArchive(doc)}
                                  className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white ${
                                    doc.state === 'ACTIVE'
                                      ? 'bg-ink-800 hover:bg-ink-900'
                                      : 'bg-primary-600 hover:bg-primary-700'
                                  }`}
                                >
                                  {doc.state === 'ACTIVE' ? 'Archive' : 'Restore'}
                                </button>
                                {doc.metadata?.scanIntake && ocrInfo.status !== 'succeeded' && (
                                  <button
                                    onClick={() => handleReindex(doc)}
                                    disabled={reindexingId === doc.id}
                                    className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium ${
                                      reindexingId === doc.id
                                        ? 'border-border/60 text-pewter'
                                        : 'border-primary-300 text-primary-700 hover:bg-primary-50'
                                    }`}
                                  >
                                    {reindexingId === doc.id ? 'Reindexing...' : 'Reindex OCR'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </RoleGuard>
      </AdminLayout>
    </>
  );
}

function parseCommaList(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function getOcrStatus(doc: DocumentResource): { status: string; label: string; badgeClass: string } {
  if (doc.textContent) {
    return { status: 'succeeded', label: 'Indexed', badgeClass: 'bg-forest-50 text-forest-700' };
  }

  const metadata = doc.metadata || {};
  const ocr = (metadata as any).ocr || {};
  const scanIntake = (metadata as any).scanIntake;

  if (!scanIntake) {
    return { status: 'skipped', label: 'No OCR', badgeClass: 'bg-forest-100 text-stone' };
  }

  switch (ocr.status) {
    case 'failed':
      return { status: 'failed', label: 'OCR failed', badgeClass: 'bg-terracotta-50 text-terracotta-700' };
    case 'unavailable':
      return { status: 'unavailable', label: 'OCR unavailable', badgeClass: 'bg-ochre-50 text-ochre-700' };
    case 'queued':
      return { status: 'queued', label: 'OCR queued', badgeClass: 'bg-ochre-50 text-ochre-700' };
    case 'processing':
      return { status: 'processing', label: 'OCR processing', badgeClass: 'bg-ochre-50 text-ochre-700' };
    default:
      return { status: 'pending', label: 'OCR pending', badgeClass: 'bg-ochre-50 text-ochre-700' };
  }
}
