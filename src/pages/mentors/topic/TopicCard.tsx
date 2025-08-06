import { Button } from "@/components/ui/button";

interface Task {
  id: number;
  title: string;
}

interface Topic {
  id: number;
  title: string;
  description?: string;
  tasks?: Task[];
}

interface Props {
  topic: Topic;
  onViewDeadline: () => void;
}

export default function TopicCard({ topic, onViewDeadline }: Props) {
  return (
    <div className="border p-4 rounded shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{topic.title}</h3>
          {topic.description && (
            <p className="text-sm text-gray-700">{topic.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={onViewDeadline}>
          Xem deadline
        </Button>
      </div>

      {topic.tasks?.length ? (
        <div className="mt-4 pl-4 border-l-2 border-gray-200">
          <p className="text-sm font-semibold mb-1">Danh sách task:</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {topic.tasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm italic text-gray-500 mt-2">
          Chưa có task nào cho topic này.
        </p>
      )}
    </div>
  );
}
