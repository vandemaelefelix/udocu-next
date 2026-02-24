# Adding New Data Types in Prismic

## Quick Start

1. **Create the type file**
   - Create a new folder: `customtypes/{type_name}/`
   - Add `index.json` with your type definition

2. **Define the type structure**

   ```json
   {
     "id": "my_type",
     "label": "My Type",
     "repeatable": true,
     "status": true,
     "format": "custom",
     "json": {
       "Main": {
         "field_name": {
           "type": "FieldType",
           "config": { "label": "Field Label" }
         }
       }
     }
   }
   ```

3. **Available field types**
   - `UID` - URL slug
   - `StructuredText` - Rich text editor
   - `Text` - Single-line text
   - `Date` - Date picker
   - `Link` - Internal/external links
   - `Image` - Image asset
   - `Select` - Dropdown menu
   - `Number` - Integer/decimal
   - `Boolean` - Checkbox
   - `Slices` - Repeatable components

4. **Example: Product type**

   ```json
   {
     "id": "product",
     "label": "Product",
     "repeatable": true,
     "status": true,
     "format": "custom",
     "json": {
       "Main": {
         "name": { "type": "Text", "config": { "label": "Name" } },
         "price": { "type": "Number", "config": { "label": "Price" } },
         "description": {
           "type": "StructuredText",
           "config": { "label": "Description" }
         }
       }
     }
   }
   ```

5. **Sync with Prismic dashboard**
   - Run: `npm run slicemachine`
   - Navigate to "Custom Types" and create a new one
   - Name it to match your JSON (`id` field)
   - The dashboard will auto-detect your local changes

6. **Generate TypeScript types**
   - Types are auto-generated in `prismicio-types.d.ts`
   - Use them in your components: `PrismicDocument<"my_type">`

## Tips

- Keep field names lowercase with underscores
- Test in Prismic dashboard before deploying
- Delete unused types from both the folder and Prismic dashboard
