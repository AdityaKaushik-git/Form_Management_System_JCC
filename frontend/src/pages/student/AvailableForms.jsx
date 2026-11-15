import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service.js';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/helpers.js';
import { Calendar, Clock, BookOpen, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const AvailableForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await studentService.getAvailableForms();
        setForms(res.data || []);
      } catch (err) {
        console.error('Failed to load forms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Checking available examination forms..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-content-primary">Available Examination Forms</h2>
        <p className="text-xs text-content-muted mt-1">
          Select an active examination form to submit your reappear application
        </p>
      </div>

      {forms.length === 0 ? (
        <EmptyState
          title="No Examination Forms Available"
          description="There are currently no active or upcoming reappear examination forms for your course. Please check back later."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forms.map((form) => {
            const isActive = form.effectiveStatus === 'active';
            const isUpcoming = form.effectiveStatus === 'upcoming';

            return (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-gray-100 shadow-card p-6 flex flex-col justify-between hover:shadow-card-hover transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
                      {form.examType?.toUpperCase() || 'REAPPEAR'}
                    </span>
                    <Badge variant={form.effectiveStatus}>
                      {form.effectiveStatus?.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-content-primary">{form.title}</h3>
                  <p className="text-xs font-semibold text-content-secondary mt-0.5">
                    {form.examName} {form.examSession ? `• ${form.examSession}` : ''}
                  </p>

                  {form.course && (
                    <div className="flex items-center gap-1.5 text-xs text-content-muted mt-2">
                      <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {form.course.name} ({form.course.shortName})
                        {form.semester ? ` - ${form.semester.name}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Scheduling Info */}
                  <div className="mt-4 p-3 bg-surface-secondary rounded-lg text-xs space-y-1.5 text-content-secondary">
                    <div className="flex items-center justify-between">
                      <span className="text-content-muted">Start Date:</span>
                      <span className="font-medium text-content-primary">
                        {formatDateTime(form.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-content-muted">Closing Date:</span>
                      <span className="font-medium text-content-primary">
                        {form.isPermanentActive ? (
                          <span className="text-emerald-600 font-semibold">Permanent Active</span>
                        ) : form.endDate ? (
                          formatDateTime(form.endDate)
                        ) : (
                          'Open'
                        )}
                      </span>
                    </div>
                  </div>

                  {form.instructions && (
                    <div className="mt-3 text-xs text-content-muted line-clamp-2">
                      <span className="font-semibold text-content-primary">Instructions: </span>
                      {form.instructions}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  {form.alreadySubmitted ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Submitted ({form.submission?.referenceNumber})</span>
                      </div>
                      <Link to={`/student/applications/${form.submission?.id}`}>
                        <Button variant="ghost" size="sm">
                          View Receipt
                        </Button>
                      </Link>
                    </div>
                  ) : isActive ? (
                    <Link to={`/student/forms/${form.id}/apply`} className="w-full">
                      <Button className="w-full">
                        Apply Now
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : isUpcoming ? (
                    <div className="w-full text-center text-xs text-amber-700 bg-amber-50 py-2 rounded-lg font-medium">
                      Form opens on {formatDateTime(form.startDate)}
                    </div>
                  ) : (
                    <div className="w-full text-center text-xs text-red-600 bg-red-50 py-2 rounded-lg font-medium">
                      Submissions closed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AvailableForms;
