import { useState } from 'react';
import { Play, RefreshCw, AlertTriangle, Clock, CheckCircle, Loader2, Zap, Ban } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const AdminAutomation = () => {
  const { api } = useAuth();
  const [runningTask, setRunningTask] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);

  const automationTasks = [
    {
      id: 'renewal',
      name: 'Generate Renewal Invoices',
      description: 'Creates invoices for servers with renewal dates within the next 7 days. Users will receive email notifications with their invoice.',
      icon: RefreshCw,
      endpoint: '/admin/run-renewal-check',
      color: 'text-accent-info',
      bgColor: 'bg-accent-info/20',
    },
    {
      id: 'suspend',
      name: 'Suspend Overdue Services',
      description: 'Suspends servers with unpaid invoices past their due date. Users will be notified via email about the suspension.',
      icon: Ban,
      endpoint: '/admin/run-suspend-check',
      color: 'text-accent-warning',
      bgColor: 'bg-accent-warning/20',
    }
  ];

  const runTask = async (task) => {
    setRunningTask(task.id);
    const startTime = new Date();
    
    try {
      const response = await api.post(task.endpoint);
      const endTime = new Date();
      
      const historyEntry = {
        id: Date.now(),
        taskId: task.id,
        taskName: task.name,
        status: 'success',
        message: response.data.message,
        timestamp: startTime.toISOString(),
        duration: endTime - startTime
      };
      
      setTaskHistory(prev => [historyEntry, ...prev].slice(0, 10));
      toast.success(response.data.message || `${task.name} completed successfully`);
    } catch (error) {
      const endTime = new Date();
      
      const historyEntry = {
        id: Date.now(),
        taskId: task.id,
        taskName: task.name,
        status: 'error',
        message: error.response?.data?.detail || 'Task failed',
        timestamp: startTime.toISOString(),
        duration: endTime - startTime
      };
      
      setTaskHistory(prev => [historyEntry, ...prev].slice(0, 10));
      toast.error(error.response?.data?.detail || `Failed to run ${task.name}`);
    } finally {
      setRunningTask(null);
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary" data-testid="automation-title">
            Automation Tasks
          </h1>
          <p className="text-text-secondary mt-1">
            Manually trigger background automation tasks
          </p>
        </div>

        {/* Info Banner */}
        <div className="glass-card p-4 border-l-4 border-accent-info">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent-info flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-text-primary font-medium">Scheduled Automation</h3>
              <p className="text-text-secondary text-sm mt-1">
                These tasks run automatically on a daily schedule. Use the buttons below to run them manually when needed.
              </p>
            </div>
          </div>
        </div>

        {/* Task Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {automationTasks.map((task) => {
            const Icon = task.icon;
            const isRunning = runningTask === task.id;
            
            return (
              <div key={task.id} className="glass-card p-6" data-testid={`task-${task.id}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${task.bgColor}`}>
                    <Icon className={`w-6 h-6 ${task.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-text-primary font-semibold text-lg mb-1">{task.name}</h3>
                    <p className="text-text-secondary text-sm mb-4">{task.description}</p>
                    <Button
                      onClick={() => runTask(task)}
                      disabled={isRunning || runningTask !== null}
                      className="btn-primary"
                      data-testid={`run-${task.id}`}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Task History */}
        <div className="glass-card p-6">
          <h2 className="font-heading text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Recent Task History
          </h2>
          
          {taskHistory.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks have been run yet</p>
              <p className="text-sm mt-1">Run a task above to see the history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {taskHistory.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-4 rounded-lg border ${
                    entry.status === 'success' 
                      ? 'bg-accent-success/5 border-accent-success/20' 
                      : 'bg-accent-error/5 border-accent-error/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {entry.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-accent-success" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-accent-error" />
                      )}
                      <div>
                        <p className="text-text-primary font-medium">{entry.taskName}</p>
                        <p className="text-text-muted text-sm">{entry.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm">{formatTime(entry.timestamp)}</p>
                      <p className="text-text-muted text-xs">{formatDuration(entry.duration)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="glass-card p-4 border-l-4 border-accent-warning">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-text-primary font-medium">Important Notes</h3>
              <ul className="text-text-secondary text-sm mt-1 space-y-1">
                <li>• <strong>Renewal Invoices:</strong> Only creates invoices for servers without existing pending invoices</li>
                <li>• <strong>Suspend Services:</strong> Only suspends servers that are currently active with overdue invoices</li>
                <li>• <strong>Email Notifications:</strong> Users will receive email notifications if SendGrid is configured</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAutomation;
