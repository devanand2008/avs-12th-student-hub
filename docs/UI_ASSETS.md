# Website design and assets

The homepage and sign-in layout use the blue gradient, rounded cards, five study features, subject grid, and white footer from the user-supplied reference at https://avs-12-hub.netlify.app/. Local pages link to this app's working routes, including account registration, the textbook library, and the existing interactive 3D lab.

`public/avs-logo.jpeg` is an unchanged copy of the user-supplied `logo and images/logo image.jpeg`. It appears in the navigation, login card, homepage, and footer.

The decorative subject photographs match the reference and are saved in `public/subject-images` for local serving. They come from Unsplash:

| Subject          | Original photo                                               |
| ---------------- | ------------------------------------------------------------ |
| Physics          | https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa |
| Chemistry        | https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6 |
| Mathematics      | https://images.unsplash.com/photo-1635070041078-e363dbe005cb |
| Computer Science | https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5 |
| Botany           | https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8 |
| Zoology          | https://images.unsplash.com/photo-1534447677768-be436bb09401 |
| Tamil            | https://images.unsplash.com/photo-1455390582262-044cdead277a |
| English          | https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8 |

Uploaded notes and video files require connected Supabase Storage. Official textbook PDF files remain local; their separate attribution and import details are in [TEXTBOOKS.md](TEXTBOOKS.md).
