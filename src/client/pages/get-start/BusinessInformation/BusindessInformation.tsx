
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@quillcrm/components/ui/form";
import { Input } from "@quillcrm/components/ui/input";
import { Textarea } from "@quillcrm/components/ui/textarea";
import ButtonComponent from "../component/button";
import UploadImageIcon from "@quillcrm/components/icons/upload-image";

export const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  address: z.string().min(1, "Business address is required").optional(),
  image: z.instanceof(File, { message: "Please upload a valid image" }).optional().nullable(),
});

export type FormType = z.infer<typeof formSchema>;

export default function BusindessInformation({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      image: null,
    },
  });

  const onSubmit = (data: FormType) => {
    console.log("Form submitted:", data);
    onNext();
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div>
        <h3 className="text-[#170F49] text-[32px] font-semibold">
          Please provide your business information
        </h3>
        <p className="text-[#777] text-lg font-normal leading-7">
          This will be used for your email campaign, Subscriber's front pages
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-[#09090B] leading-[150%]">
                  Business Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your business name"
                    {...field}
                    className="border border-[#DEE1E6] rounded-[8px] h-12 py-[5px] px-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grid: Address + Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base text-[#09090B] leading-[150%]">
                    Business Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type here business address...."
                      {...field}
                      className="border border-[#DEE1E6] rounded-[8px]  py-3 px-4 min-h-[190px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload  */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => {
                const file: File | null = field.value || null;

                const onDrop = (acceptedFiles: File[]) => {
                  if (acceptedFiles[0]) {
                    field.onChange(acceptedFiles[0]);
                  }
                };

                const { getRootProps, getInputProps, isDragActive } = useDropzone({
                  onDrop,
                  accept: { "image/*": [] },
                  multiple: false,
                });

                return (
                  <FormItem>
                    <FormLabel className="text-base text-[#09090B] leading-[150%]">
                    Logo
                    </FormLabel>
                    <FormControl>
                      <div
                        {...getRootProps()}
                        className={`
                          relative border-2 border-dashed rounded-2xl 
                          flex flex-col items-center justify-center py-12 cursor-pointer 
                          transition-all text-center
                          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                          ${form.formState.errors.image ? "border-red-500" : ""}
                        `}
                      >
                        <input {...getInputProps()} />

                        {file ? (
                          <div className="space-y-4">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Logo preview"
                              className="w-32 h-32 object-contain rounded-lg border"
                            />
                            <p className="text-sm text-gray-600">
                              Click or drag to replace
                            </p>
                          </div>
                        ) : (
                          <>
                            <UploadImageIcon/>
                            <p className="text-xl leading-[30px] font-medium text-[#458DC7]">
                              Browse images<span className=" text-[#09090B]"> to upload</span>
                            </p>
                            <p className="text-base leading-[26px] text-[#979797] mt-1">
                              or drag and drop it here
                            </p>
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-8">
            <ButtonComponent onClick={onPrevious} type="">
              Previous
            </ButtonComponent>
            <ButtonComponent type="go" onClick={form.handleSubmit(onSubmit)}>
              Next Step
            </ButtonComponent>
          </div>
        </form>
      </Form>
    </div>
  );
}