alter table public.patients
add constraint patients_phone_unique unique (phone);
