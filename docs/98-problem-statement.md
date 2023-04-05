# Questions to be answered

1. ~~How dimensions are stored in cQube?~~
2. ~~How to create a new dimension?~~
3. Type of Data that can be imported?
4. Managing Data Retention based on the dimension.
5. What happens when dimensions are not provided?
6. What if the data is provided with a different granularity?
    - Examples of granularity
        - Data is captured every day but is shared with a field=date
        - Data is captured every hour but is shared with a field=week
        - Data is captured every hour but is shared with a field=month
    - How is this managed when creating charts?
        - Embed this as part of the dimension definition.
        - KPIs should include the granularity with which the data is captured.
        - KPIs should also show that the certain queries are not possible because of the granularity.
    - Data Retention policy and how is it managed for separate dimensions?
7. What if rollups are not even required?
    - How is this managed?
    - How is this managed when creating charts?

## Data

1. Counter based approach - UpDownCounter is a synchronous Instrument which supports increments and decrements. This kind of instrument is commonly used to capture changes in a sum, or to capture any other value that rises and falls over time. How this helps?
    - Pros
        - Doesn't require any additional storage of time series data.
        - Can be used to capture data for any time period - day, week, month, year
        - Easily extendable to arbitrary dimensions (not just time)
    - Cons
        - Multiple

## Storage of Dimensions

cQube allows for the following types of dimensions
1. Time Based Dimensions
    - Day - For the last 30 days
    - Last 7 days
    - Last 30 days
    - Monthly
    - Yearly
2. Dynamic Dimensions based on the data
    1. Based on the events that need to be captured

## Defining Dimensions


## Managing Multiple Dimensions
- For example - Time + District
    - .

## Storage of Datasets

## Management of Tables

1. Add all data to hypertables with a rollup