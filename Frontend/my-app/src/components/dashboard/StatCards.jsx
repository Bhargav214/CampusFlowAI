import {
    Users,
    CalendarCheck,
    GraduationCap,
    AlertTriangle
} from "lucide-react";


const cards = [
    {
        title: "Total Students",
        key: "students",
        icon: Users
    },
    {
        title: "Average Attendance",
        key: "attendance",
        icon: CalendarCheck
    },
    {
        title: "Average Marks",
        key: "marks",
        icon: GraduationCap
    },
    {
        title: "High Risk Students",
        key: "risk",
        icon: AlertTriangle
    }
];


export default function StatCards({ data }) {

    return (

        <div className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
        ">

            {cards.map((card) => {

                const Icon = card.icon;

                return (

                    <div
                        key={card.key}
                        className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-5
                            shadow-sm
                            transition
                            hover:-translate-y-1
                            hover:shadow-lg
                        "
                    >

                        <div className="
                            flex
                            items-center
                            justify-between
                        ">

                            <p className="
                                text-sm
                                text-slate-500
                            ">
                                {card.title}
                            </p>

                            <Icon
                                size={20}
                                className="text-slate-500"
                            />

                        </div>


                        <p className="
                            mt-4
                            text-3xl
                            font-bold
                            text-slate-900
                        ">
                            {data[card.key]}
                        </p>

                    </div>

                );

            })}

        </div>
    );
}