'use client';

import * as React from 'react';
import { Controller, type ControllerProps, type FieldPath, type FieldValues, FormProvider, useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ---- Contexts ----
type FormFieldCtxValue = { name: string };
const FormFieldContext = React.createContext<FormFieldCtxValue>({ name: '' });

type FormItemCtxValue = { id: string };
const FormItemContext = React.createContext<FormItemCtxValue>({ id: '' });

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  const fieldState = fieldContext.name ? getFieldState(fieldContext.name, formState) : { invalid: false, error: undefined };
  return { name: fieldContext.name, id: itemContext.id, ...fieldState };
}

// ---- Exports ----
export const Form = FormProvider;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: String(props.name) }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

export function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { id, error } = useFormField();
  return (
    <Label
      htmlFor={id}
      className={cn(error ? 'text-destructive' : '', className)}
      {...props}
    />
  );
}

export function FormControl({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactElement }) {
  const { id, error } = useFormField();

  // به فرزند یک id و aria-invalid وصل می‌کنیم
  const child = React.cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    ...children.props,
  });

  return (
    <div {...props}>
      {child}
    </div>
  );
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-[0.8rem] text-muted-foreground', className)} {...props} />
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error } = useFormField();
  const body = error?.message ? String(error.message) : children;
  if (!body) return null;
  return (
    <p className={cn('text-[0.8rem] font-medium text-destructive', className)} {...props}>
      {body}
    </p>
  );
}
