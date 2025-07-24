import React from "react";
import { useForm } from "react-hook-form";
import { useClickOutside } from "../../../hooks/useCloseModal";
import { useRef } from "react";
export type UserType = "intern" | "mentor";

interface FormData {
  name: string;
  email: string;
  password?: string;
  bio?: string;
  school?: string;
  major?: string;
  phone?: string;
  linkedinLink?: string;
  expertise?: string;
}

export default function UserForm({
  onClose,
  onSubmit,
  initialData,
  type = "intern",
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: FormData;
  type?: UserType;
}) {
  console.log("re-render");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      bio: initialData?.bio || "",
      school: initialData?.school || "",
      major: initialData?.major || "",
      phone: initialData?.phone || "",
      linkedinLink: initialData?.linkedinLink || "",
      expertise: initialData?.expertise || "",
    },
  });
  const modalRef = React.useRef<HTMLDivElement>(null);
useClickOutside(modalRef, onClose);

  React.useEffect(() => {
    if (initialData) {
      reset({ ...initialData, password: "" });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: FormData) => {
    if (initialData) delete data.password; 
    onSubmit(data);
    onClose();
  };

  return (
    <div ref={modalRef} className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white z-50 shadow-xl p-6 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-blue-900">
          {initialData
            ? `Edit ${type === "intern" ? "Intern" : "Mentor"}`
            : `Add New ${type === "intern" ? "Intern" : "Mentor"}`}
        </h2>
        <button onClick={onClose}>✕</button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
        <div>
          <label className="text-sm text-gray-700 block">Full Name *</label>
          <input
            {...register("name", { required: true })}
            className="border p-2 rounded w-full outline-none"
          />
          {errors.name && <p className="text-red-500 text-sm">Bắt buộc</p>}
        </div>

        <div>
          <label className="text-sm text-gray-700 block">Email *</label>
          <input
            type="email"
            {...register("email", { required: true })}
            className="border p-2 rounded w-full outline-none"
          />
          {errors.email && <p className="text-red-500 text-sm">Bắt buộc</p>}
        </div>

        {!initialData && (
          <div>
            <label className="text-sm text-gray-700 block">Password *</label>
            <input
              type="password"
              {...register("password", { required: true })}
              className="border p-2 rounded w-full outline-none"
            />
            {errors.password && <p className="text-red-500 text-sm">Bắt buộc</p>}
          </div>
        )}

        <div>
          <label className="text-sm text-gray-700 block">Profile Summary</label>
          <textarea
            {...register("bio")}
            rows={3}
            className="border p-2 rounded w-full outline-none resize-none"
          />
        </div>

        {type === "intern" && (
          <>
            <input {...register("school")} placeholder="School" className="border p-2 rounded w-full" />
            <input {...register("major")} placeholder="Major" className="border p-2 rounded w-full" />
            <input {...register("phone")} placeholder="Phone" className="border p-2 rounded w-full" />
            <input {...register("linkedinLink")} placeholder="LinkedIn" className="border p-2 rounded w-full" />
          </>
        )}

        {type === "mentor" && (
          <input {...register("expertise")} placeholder="Expertise" className="border p-2 rounded w-full" />
        )}

        <button
          type="submit"
          className="mt-6 bg-blue-900 text-white w-full py-2 rounded hover:bg-blue-800"
        >
          {initialData ? "Update" : "Submit"}
        </button>
      </form>
    </div>
  );
}
