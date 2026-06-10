import React, { useState } from 'react';
import { FaRobot, FaPaperPlane, FaCalendarAlt, FaEdit, FaEye, FaSpinner, FaFileAlt } from 'react-icons/fa';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ReleaseSummaryGenerator = ({ projectId, projectName, theme }) => {
  const { showToast } = useToast();
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [previewMode, setPreviewMode] = useState('edit'); // 'edit' or 'preview'

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      showToast('Please select a start date and end date.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post(`/projects/${projectId}/releases/generate`, {
        startDate,
        endDate
      });

      if (response.data?.success) {
        setReleaseNotes(response.data.releaseSummary);
        showToast('Release notes draft generated successfully!', 'success');
      } else {
        throw new Error(response.data?.error || 'Failed to generate');
      }
    } catch (err) {
      console.error('Failed to generate release notes:', err);
      showToast(err.response?.data?.error || err.message || 'Error generating release notes.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleEmailTeam = async () => {
    if (!version) {
      showToast('Please provide a version (e.g. v1.0.0).', 'warning');
      return;
    }
    if (!releaseNotes) {
      showToast('Please generate or write some release notes first.', 'warning');
      return;
    }

    setSending(true);
    try {
      const response = await api.post(`/projects/${projectId}/releases/email`, {
        version,
        title,
        description,
        releaseContent: releaseNotes
      });

      if (response.data?.success) {
        showToast(`Release summary emailed successfully!`, 'success');
      } else {
        throw new Error(response.data?.error || 'Failed to send emails');
      }
    } catch (err) {
      console.error('Failed to send release email:', err);
      showToast(err.response?.data?.error || err.message || 'Error sending emails.', 'error');
    } finally {
      setSending(false);
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (md) => {
    if (!md) return <span className="text-slate-500 italic text-sm">No release notes content yet.</span>;
    
    // Split by lines and convert basic markdown
    const lines = md.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-md font-bold text-indigo-500 mt-4 mb-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-5 border-b border-slate-700/10 pb-1">{line.replace('## ', '')}</h3>;
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-6">{line.replace('# ', '')}</h2>;
          }
          if (line.startsWith('- ')) {
            // Check for bold parts **text**
            const content = line.replace('- ', '');
            const parts = content.split('**');
            return (
              <ul key={idx} className="list-disc pl-5">
                <li className="text-slate-600 dark:text-slate-300">
                  {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-indigo-400">{part}</strong> : part)}
                </li>
              </ul>
            );
          }
          return <p key={idx} className="text-slate-600 dark:text-slate-300">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Automated Release Summary Generator</h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Generate changelogs using AI and email them to the project team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Release Configuration Form */}
        <div className={`lg:col-span-1 p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${
          theme === 'dark' 
            ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl' 
            : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
        }`}>
          <div className="space-y-4">
            <h3 className="text-md font-bold mb-2 flex items-center gap-2 border-b border-slate-200/10 pb-2">
              <FaCalendarAlt className="text-indigo-500" />
              <span>Release Details</span>
            </h3>

            {/* Version */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Release Version</label>
              <input
                type="text"
                placeholder="e.g. v1.0.4"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                }`}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Release Title</label>
              <input
                type="text"
                placeholder="e.g. Authentication Patch"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Brief Description</label>
              <textarea
                rows={2}
                placeholder="Optional release comments..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${
                  theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                }`}
              />
            </div>

            {/* Date range selection */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10"
            >
              {generating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Drafting Changelog...</span>
                </>
              ) : (
                <>
                  <FaRobot />
                  <span>Generate Summary with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Release Notes Draft Preview & Editor */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border backdrop-blur-md flex flex-col justify-between ${
          theme === 'dark' 
            ? 'bg-slate-950/70 border-white/10 shadow-slate-950/65 shadow-2xl' 
            : 'bg-white/90 border-slate-200/80 shadow-slate-200/40 shadow-xl'
        }`}>
          <div className="flex-1 flex flex-col min-h-[300px]">
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/10">
              <h3 className="text-md font-bold flex items-center gap-2">
                <FaFileAlt className="text-indigo-500" />
                <span>Draft Release Notes</span>
              </h3>

              <div className="flex items-center border border-slate-200/10 rounded-xl overflow-hidden shadow-sm p-0.5">
                <button
                  onClick={() => setPreviewMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewMode === 'edit'
                      ? theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FaEdit size={11} /> Edit Draft
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewMode === 'preview'
                      ? theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FaEye size={11} /> Live Preview
                </button>
              </div>
            </div>

            {/* Note space */}
            <div className="flex-1 flex flex-col">
              {previewMode === 'edit' ? (
                <textarea
                  value={releaseNotes}
                  onChange={e => setReleaseNotes(e.target.value)}
                  placeholder="The AI-generated changelog draft will appear here, or you can start typing your own notes manually..."
                  className={`w-full flex-1 min-h-[250px] p-4 rounded-xl border text-sm font-mono outline-none resize-none ${
                    theme === 'dark' ? 'bg-slate-900 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              ) : (
                <div className={`w-full flex-1 min-h-[250px] p-5 rounded-xl border overflow-y-auto max-h-[350px] ${
                  theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  {renderMarkdown(releaseNotes)}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleEmailTeam}
              disabled={sending || !releaseNotes || !version}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Emailing Project Team...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Publish & Email Team</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseSummaryGenerator;
