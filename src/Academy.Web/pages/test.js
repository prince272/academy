import ReactionBarSelector from "../components/ReactionSelector";

const TestPage = () => {
    return (<div className="p-10 m-10"><ReactionBarSelector reactions={{ like: 5, love: 100, happy: 899, surprised: 1, sad: 0, angry: 2 }} /></div>);
};

export default TestPage;