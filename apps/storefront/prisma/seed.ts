// prisma/seed.ts
import { PrismaClient, OrderStatusEnum, PaymentStatusEnum } from "@prisma/client"

const prisma = new PrismaClient()

// ---------- helpers ----------
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const choice = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)]
const randomBool = (pTrue = 0.7) => Math.random() < pTrue
const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    // scatter within the day
    d.setHours(rand(0, 23), rand(0, 59), rand(0, 59), rand(0, 999))
    return d
}
const money = (min: number, max: number, step = 1) => Math.round((min + Math.random() * (max - min)) / step) * step

// ---------- seed data ----------
const BRAND_SEED = [
    { title: "Nike", description: "Sportswear brand", logo: "https://picsum.photos/seed/nike-logo/200/200" },
    { title: "Adidas", description: "Sportswear brand", logo: "https://picsum.photos/seed/adidas-logo/200/200" },
    { title: "Apple", description: "Technology brand", logo: "https://picsum.photos/seed/apple-logo/200/200" },
    { title: "Samsung", description: "Technology brand", logo: "https://picsum.photos/seed/samsung-logo/200/200" },
    { title: "Sony", description: "Electronics brand", logo: "https://picsum.photos/seed/sony-logo/200/200" },
]

const CATEGORY_SEED = [
    { title: "Shoes", description: "All kinds of shoes" },
    { title: "Electronics", description: "Phones, laptops, gadgets" },
    { title: "Wearables", description: "Watches, fitness trackers" },
    { title: "Audio", description: "Headphones, speakers" },
    { title: "Accessories", description: "Cases, chargers, bands" },
]

const PRODUCT_TEMPLATES = [
    { title: "Nike Air Max", basePrice: 120, keywords: ["nike", "shoes", "running"], img: "https://picsum.photos/seed/nike-airmax/800/600", brand: "Nike", cats: ["Shoes"] },
    { title: "Nike Pegasus Trail", basePrice: 140, keywords: ["nike", "trail", "shoes"], img: "https://picsum.photos/seed/pegasus-trail/800/600", brand: "Nike", cats: ["Shoes"] },
    { title: "Adidas Ultraboost", basePrice: 150, keywords: ["adidas", "ultraboost"], img: "https://picsum.photos/seed/adidas-ultraboost/800/600", brand: "Adidas", cats: ["Shoes"] },
    { title: "Apple Watch Ultra", basePrice: 799, keywords: ["apple", "watch", "wearable"], img: "https://picsum.photos/seed/apple-watch-ultra/800/600", brand: "Apple", cats: ["Wearables", "Accessories"] },
    { title: "iPhone 15 Pro", basePrice: 1200, keywords: ["apple", "iphone", "smartphone"], img: "https://picsum.photos/seed/iphone15-pro/800/600", brand: "Apple", cats: ["Electronics", "Accessories"] },
    { title: "Galaxy S24", basePrice: 999, keywords: ["samsung", "smartphone"], img: "https://picsum.photos/seed/galaxy-s24/800/600", brand: "Samsung", cats: ["Electronics", "Accessories"] },
    { title: "Sony WH-1000XM5", basePrice: 399, keywords: ["sony", "headphones"], img: "https://picsum.photos/seed/sony-wh1000xm5/800/600", brand: "Sony", cats: ["Audio", "Accessories"] },
    { title: "HomePod mini", basePrice: 99, keywords: ["apple", "speaker", "audio"], img: "https://picsum.photos/seed/homepod-mini/800/600", brand: "Apple", cats: ["Audio", "Electronics"] },
]

// more variety by duplicating w/ slight price variance
function expandProducts() {
    const list: typeof PRODUCT_TEMPLATES = []
    PRODUCT_TEMPLATES.forEach(p => {
        const copies = rand(1, 3)
        for (let i = 0; i < copies; i++) {
            list.push({
                ...p,
                title: i === 0 ? p.title : `${p.title} ${i + 1}`,
                basePrice: Math.max(10, p.basePrice + rand(-30, 30))
            })
        }
    })
    return list
}

async function main() {
    console.log("Seeding…")

    // ---------- brands & categories (idempotent) ----------
    await prisma.brand.createMany({ data: BRAND_SEED, skipDuplicates: true })
    await prisma.category.createMany({ data: CATEGORY_SEED, skipDuplicates: true })

    const brands = await prisma.brand.findMany()
    const categories = await prisma.category.findMany()
    const brandByTitle = new Map(brands.map(b => [b.title, b]))
    const categoryByTitle = new Map(categories.map(c => [c.title, c]))

    // ---------- products ----------
    const productTemplates = expandProducts()
    const createdProducts: Array<{ id: string; title: string; price: number }> = []

    for (const p of productTemplates) {
        const brand = brandByTitle.get(p.brand)!
        const catIds = p.cats.map((ct) => categoryByTitle.get(ct)!.id)

        const existing = await prisma.product.findFirst({
            where: { title: p.title },
            select: { id: true, title: true, price: true },
        })

        const product =
            existing ??
            (await prisma.product.create({
                data: {
                    title: p.title,
                    description: `${p.title} description`,
                    images: [p.img],
                    keywords: p.keywords,
                    price: p.basePrice,
                    discount: randomBool(0.3) ? rand(5, 20) : 0,
                    stock: rand(5, 100),
                    isPhysical: true,
                    isAvailable: true,
                    isFeatured: randomBool(0.2),
                    brand: { connect: { id: brand.id } },
                    categories: { connect: catIds.map((id) => ({ id })) },
                },
                select: { id: true, title: true, price: true },
            }))

        createdProducts.push(product)
    }
    console.log(`Products: ${createdProducts.length}`)

    // ---------- cross-sell relationships ----------
    // Create some cross-sell links between products
    if (createdProducts.length >= 4) {
        const nikeProducts = createdProducts.filter(p => p.title.includes('Nike'))
        const adidasProducts = createdProducts.filter(p => p.title.includes('Adidas'))
        const appleProducts = createdProducts.filter(p => p.title.includes('Apple'))
        const sonyProducts = createdProducts.filter(p => p.title.includes('Sony'))

        // Link Nike shoes with each other (bidirectional)
        if (nikeProducts.length >= 2) {
            for (let i = 0; i < nikeProducts.length; i++) {
                const otherNikeProducts = nikeProducts.filter((_, idx) => idx !== i)
                await prisma.product.update({
                    where: { id: nikeProducts[i].id },
                    data: {
                        crossSellProducts: {
                            connect: otherNikeProducts.slice(0, 2).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
        }

        // Link Adidas shoes with Nike shoes (bidirectional)
        if (adidasProducts.length >= 1 && nikeProducts.length >= 1) {
            for (const adidasProduct of adidasProducts) {
                await prisma.product.update({
                    where: { id: adidasProduct.id },
                    data: {
                        crossSellProducts: {
                            connect: nikeProducts.slice(0, 2).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
            // Also link Nike products back to Adidas
            for (const nikeProduct of nikeProducts) {
                await prisma.product.update({
                    where: { id: nikeProduct.id },
                    data: {
                        crossSellProducts: {
                            connect: adidasProducts.slice(0, 1).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
        }

        // Link Apple products with each other (bidirectional)
        if (appleProducts.length >= 2) {
            for (let i = 0; i < appleProducts.length; i++) {
                const otherAppleProducts = appleProducts.filter((_, idx) => idx !== i)
                await prisma.product.update({
                    where: { id: appleProducts[i].id },
                    data: {
                        crossSellProducts: {
                            connect: otherAppleProducts.slice(0, 2).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
        }

        // Link Sony headphones with Apple products (bidirectional)
        if (sonyProducts.length >= 1 && appleProducts.length >= 1) {
            for (const sonyProduct of sonyProducts) {
                await prisma.product.update({
                    where: { id: sonyProduct.id },
                    data: {
                        crossSellProducts: {
                            connect: appleProducts.slice(0, 2).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
            // Also link Apple products back to Sony
            for (const appleProduct of appleProducts) {
                await prisma.product.update({
                    where: { id: appleProduct.id },
                    data: {
                        crossSellProducts: {
                            connect: sonyProducts.slice(0, 1).map(p => ({ id: p.id }))
                        }
                    }
                })
            }
        }
    }

    // ---------- banners ----------
    await prisma.banner.createMany({
        data: [
            { image: "https://picsum.photos/seed/banner-1/1200/400", label: "Spring Sale" },
            { image: "https://picsum.photos/seed/banner-2/1200/400", label: "New Arrivals" },
        ],
        skipDuplicates: true
    })

    // ---------- payment providers ----------
    const providers = ["Stripe", "Paypal", "Paymongo"]
    await prisma.paymentProvider.createMany({
        data: providers.map(title => ({ title, isActive: true })),
        skipDuplicates: true
    })
    const providerList = await prisma.paymentProvider.findMany()

    // ---------- users (admin-ish + customers) ----------
    const admin = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {},
        create: {
            email: "admin@example.com",
            phone: "09170000001",
            name: "Dev Admin",
            isEmailVerified: true,
            isPhoneVerified: true,
            cart: { create: {} },
        }
    })

    const john = await prisma.user.upsert({
        where: { email: "john@example.com" },
        update: {},
        create: {
            email: "john@example.com",
            phone: "09171234567",
            name: "John Doe",
            birthday: "1990-01-01",
            referralCode: "REF123",
            isEmailVerified: true,
            isPhoneVerified: true,
            cart: {
                create: {
                    items: {
                        create: [
                            { productId: choice(createdProducts).id, count: 2 },
                            { productId: choice(createdProducts).id, count: 1 },
                        ],
                    },
                },
            },
            wishlist: { connect: [{ id: choice(createdProducts).id }] },
        },
    })

    const jane = await prisma.user.upsert({
        where: { email: "jane@example.com" },
        update: {},
        create: {
            email: "jane@example.com",
            phone: "09170000002",
            name: "Jane Smith",
            isEmailVerified: true,
            cart: { create: {} },
        }
    })

    // ---------- addresses ----------
    const johnAddr = await prisma.address.upsert({
        where: { id: `addr_${john.id}` }, // stable key for idempotency
        update: {},
        create: {
            id: `addr_${john.id}`,
            country: "PH",
            address: "123 Main St",
            city: "Taguig",
            phone: "09170000000",
            postalCode: "1630",
            userId: john.id,
        }
    })

    const janeAddr = await prisma.address.upsert({
        where: { id: `addr_${jane.id}` },
        update: {},
        create: {
            id: `addr_${jane.id}`,
            country: "PH",
            address: "456 Poblacion",
            city: "Makati",
            phone: "09170000003",
            postalCode: "1200",
            userId: jane.id,
        }
    })

    // ---------- author + blog ----------
    await prisma.author.upsert({
        where: { email: "author@example.com" },
        update: {},
        create: {
            email: "author@example.com",
            name: "Blog Author",
            blogs: {
                create: [
                    {
                        slug: "first-blog",
                        title: "My First Blog",
                        image: "https://picsum.photos/seed/blog-hero/1200/600",
                        description: "A sample blog post",
                        content: "This is the blog content...",
                        categories: ["tech", "life"],
                        keywords: ["sample", "blog"],
                    },
                ],
            },
        },
    })

    // ---------- orders (last 60–90 days so /reports shows data) ----------
    const users = [john, jane]
    const statuses: OrderStatusEnum[] = [
        OrderStatusEnum.Processing,
        OrderStatusEnum.Shipped,
        OrderStatusEnum.Delivered,
        OrderStatusEnum.Cancelled,
    ]

    const ORDERS_TO_CREATE = 35
    for (let i = 0; i < ORDERS_TO_CREATE; i++) {
        const user = choice(users)
        const addrId = user.id === john.id ? johnAddr.id : janeAddr.id
        const createdAt = daysAgo(rand(0, 75)) // within ~last 2.5 months
        const itemCount = rand(1, 3)

        // pick distinct products
        const itemsPool = [...createdProducts]
        const items = []
        for (let k = 0; k < itemCount; k++) {
            const idx = rand(0, itemsPool.length - 1)
            const p = itemsPool.splice(idx, 1)[0]
            const count = rand(1, 3)
            const linePrice = p.price // store snapshot of price at purchase
            const lineDiscount = randomBool(0.3) ? money(2, 20) : 0 // per-item discount in same currency
            items.push({ productId: p.id, count, price: linePrice, discount: lineDiscount })
        }

        const total = items.reduce((acc, it) => acc + it.price * it.count, 0)
        const discount = items.reduce((acc, it) => acc + it.discount * it.count, 0)
        const shipping = randomBool(0.5) ? money(0, 250, 5) : 0
        const tax = 0
        const payable = Math.max(0, total - discount + shipping + tax)

        const isPaid = randomBool(0.8)
        const status = isPaid ? choice([OrderStatusEnum.Processing, OrderStatusEnum.Shipped, OrderStatusEnum.Delivered]) : choice([OrderStatusEnum.Cancelled, OrderStatusEnum.Denied])

        const order = await prisma.order.create({
            data: {
                createdAt,
                status,
                total,
                shipping,
                payable,
                tax,
                discount,
                isPaid,
                isCompleted: status === OrderStatusEnum.Delivered,
                userId: user.id,
                addressId: addrId,
                orderItems: { create: items },
                payments: isPaid
                    ? {
                        create: {
                            status: PaymentStatusEnum.Paid,
                            isSuccessful: true,
                            payable,
                            refId: `REF-${Date.now()}-${i}-${rand(1000, 9999)}`,
                            userId: user.id,
                            providerId: choice(providerList).id,
                        },
                    }
                    : undefined,
            },
        })

        // (optional) add 1–3 product reviews to delivered orders
        if (order.status === OrderStatusEnum.Delivered && randomBool(0.4)) {
            for (const it of items.slice(0, rand(1, items.length))) {
                await prisma.productReview.create({
                    data: {
                        productId: it.productId,
                        userId: user.id,
                        rating: rand(3, 5),
                        text: "Solid product 👍",
                    },
                })
            }
        }
    }

    console.log("Done.")
    console.log("Tip: set DEV_AUTH_BYPASS=true and DEV_ADMIN_ID to this user id for dummy admin access:")
    console.log({ adminUserId: admin.id })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
