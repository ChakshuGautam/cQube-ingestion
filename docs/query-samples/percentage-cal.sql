/* KPI = Get summary of all months with %compliance assuming compliance is >80% */
SELECT avg*100 as compliance, academicyear, to_char(TO_DATE (month::text, 'MM'), 'Month') as mon from datasets.rev_and_monitoring_block_monthly_academicyear
LEFT JOIN "dimensions"."academicyear" ON  "datasets"."rev_and_monitoring_block_monthly_academicyear"."academicyear_id" = "dimensions"."academicyear"."academicyear_id"
WHERE
    "datasets"."rev_and_monitoring_block_monthly_academicyear"."academicyear_id" = '2022-23' and 
    avg > 0.80;